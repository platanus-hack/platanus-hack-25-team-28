import { ChatAnthropic } from "@langchain/anthropic"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { formatTemplate, getPromptAgentConfig } from "../promptLoader"
import { getStoreCategories, mapCategoryToStore, StoreName } from "../storeConfig"
import { ConversationMessage, PromptAnalysis } from "../types"

export class PromptAgent {
  private llm: ChatAnthropic
  private storeName?: StoreName

  constructor(apiKey: string, storeName?: StoreName) {
    this.llm = new ChatAnthropic({
      apiKey,
      model: "claude-haiku-4-5-20251001",
      temperature: 0.3,
    })
    this.storeName = storeName
  }

  private formatHistory(history: ConversationMessage[]): string {
    return history
      .map(
        (m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`
      )
      .join("\n")
  }

  private getSystemPrompt(): string {
    const baseConfig = getPromptAgentConfig()
    
    if (!this.storeName) {
      // Use default prompt from YAML file
      return baseConfig.system
    }

    // Build store-specific system prompt
    const storeCategories = getStoreCategories(this.storeName)
    const categoriesList = storeCategories
      .map((cat) => `- "${cat}"`)
      .join("\n")

    return `Eres un agente que toma el mensaje del usuario y lo deja listo para un flujo RAG de compras.
Objetivo: limpiar y estructurar la petición sin limitarla, preservando datos clave como cantidad de personas, presupuesto, productos deseados, ocasión, restricciones y preferencias.

Debes devolver ÚNICAMENTE un JSON VÁLIDO con esta forma exacta:
{
  "cleanedPrompt": "texto breve y accionable en español que resume lo pedido",
  "categories": ["categoria1", "categoria2"],
  "keywords": ["palabra1", "palabra2"],
  "budget": number | null
}

Instrucciones:
- "cleanedPrompt":
  - Resume en español lo que el usuario quiere comprar y para qué, de forma breve y accionable.
  - Mantén todas las pistas sobre: cantidad de personas, ocasión, restricciones (dietas, tallas, alergias, marcas a evitar), estilo deseado, frecuencia de uso, etc.
  - No cambies la intención del usuario ni limites su pedido.

- "categories":
  - Es una lista opcional de categorías de producto SOLO si el usuario las menciona de forma explícita.
  - Si menciona categorías de supermercado, usa estos slugs exactos cuando apliquen:
${categoriesList}
  - No inventes categorías genéricas si el usuario no dio una pista clara.
  - Si no hay señales claras de categorías, devuelve [].

- "keywords":
  - Incluye palabras clave importantes para buscar productos: marcas, modelos, tipos de producto, ingredientes, medidas, sabores, materiales, etc.
  - No incluyas palabras vacías ni conectores ("para", "de", "con", etc.).
  - Usa minúsculas y una forma corta por palabra, sin duplicados.
  - En los keywords sugiere marcas de productos aun cuando el usuario no las mencione.

- "budget":
  - Si el usuario menciona un monto total (ej: "tengo 50.000", "presupuesto de 200 dólares"), extrae el número y devuélvelo como número (sin símbolo de moneda).
  - Si menciona un rango (ej: "entre 30 y 50 mil"), usa el valor máximo del rango como presupuesto.
  - Si menciona un presupuesto por persona o por producto de forma clara, extrae ese monto.
  - Si hay varias cifras y es ambiguo, elige la que parezca el presupuesto principal de la compra.
  - Si NO hay ninguna referencia clara a dinero, devuelve null.

Reglas generales:
- No inventes categorías ni presupuesto si el usuario no los dio.
- No añadas campos extra al JSON.
- Usa siempre null (sin comillas) cuando no haya presupuesto.
- La respuesta debe estar SIEMPRE en español y debe ser EXCLUSIVAMENTE el JSON (sin texto antes ni después, sin comentarios, sin explicaciones).`
  }

  async analyze(
    userMessage: string,
    history: ConversationMessage[] = [],
    availableCategories: string[] = []
  ): Promise<PromptAnalysis> {
    const promptConfig = getPromptAgentConfig()
    const systemPrompt = this.getSystemPrompt()
    const userPrompt = formatTemplate(promptConfig.user_template || "", {
      history: this.formatHistory(history.slice(-6)) || "Sin historial.",
      user_message: userMessage,
    })

    const response = await this.llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ])
    const content = response.content as string
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return {
        cleanedPrompt: userMessage,
        categories: [],
        budget: undefined,
      }
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Map categories to store-specific format if storeName is provided
    let categories: Array<{ category: string; keywords: string[] }> = []
    if (Array.isArray(parsed.categories)) {
      if (this.storeName) {
        // Map user categories to store-specific categories
        for (const userCat of parsed.categories) {
          const mappedCat = mapCategoryToStore(userCat, this.storeName)
          if (mappedCat) {
            categories.push({
              category: mappedCat,
              keywords: parsed.keywords || [],
            })
          }
        }
      } else {
        // Legacy format: array of category objects or strings
        categories = parsed.categories.map((cat: any) => {
          if (typeof cat === "string") {
            return { category: cat, keywords: parsed.keywords || [] }
          }
          return {
            category: cat.category || cat,
            keywords: cat.keywords || parsed.keywords || [],
          }
        })
      }
    }

    return {
      cleanedPrompt: parsed.cleanedPrompt || userMessage,
      categories: categories,
      budget: typeof parsed.budget === "number" ? parsed.budget : undefined,
    }
  }
}
