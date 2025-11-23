import { ChatAnthropic } from "@langchain/anthropic"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { StoreName } from "../storeConfig"
import { RecommendationResult, SelectedProduct } from "../types"

export type StoreRecommendation = {
  storeName: StoreName
  analysis: {
    cleanedPrompt: string
    categories: Array<{ category: string; keywords: string[] }>
    budget?: number
  }
  recommendation: RecommendationResult
}

export class DecisionAgent {
  private llm: ChatAnthropic

  constructor(apiKey: string) {
    this.llm = new ChatAnthropic({
      apiKey,
      model: "claude-haiku-4-5-20251001",
      temperature: 0.4,
    })
  }

  async combineRecommendations(
    storeRecommendations: StoreRecommendation[]
  ): Promise<
    RecommendationResult & { storeAssignments: Map<string, StoreName> }
  > {
    // If only one store has recommendations, return it
    if (storeRecommendations.length === 1) {
      const single = storeRecommendations[0]
      const storeAssignments = new Map<string, StoreName>()
      single.recommendation.selectedProducts.forEach((p) => {
        storeAssignments.set(p._id, single.storeName)
      })
      return {
        ...single.recommendation,
        storeAssignments,
      }
    }

    // Collect all products from all stores
    const allProducts: SelectedProduct[] = []
    const productStoreMap = new Map<string, StoreName>()

    for (const storeRec of storeRecommendations) {
      for (const product of storeRec.recommendation.selectedProducts) {
        // Check if we already have this product (by ID)
        const existing = allProducts.find((p) => p._id === product._id)

        if (!existing) {
          // Add product with store information
          const productWithStore = {
            ...product,
            store: storeRec.storeName as string,
          }
          allProducts.push(productWithStore as SelectedProduct)
          productStoreMap.set(product._id, storeRec.storeName)
        } else {
          // If product exists, prefer the one with better price or keep the first
          const existingPrice = existing.minPrice || 0
          const newPrice = product.minPrice || 0
          if (newPrice < existingPrice && newPrice > 0) {
            // Replace with cheaper option
            const index = allProducts.indexOf(existing)
            const productWithStore = {
              ...product,
              store: storeRec.storeName as string,
            }
            allProducts[index] = productWithStore as SelectedProduct
            productStoreMap.set(product._id, storeRec.storeName)
          }
        }
      }
    }

    // Use LLM to generate a unified recommendation message
    const storesSummary = storeRecommendations
      .map(
        (sr) =>
          `${sr.storeName}: ${sr.recommendation.recommendation} (${sr.recommendation.selectedProducts.length} productos)`
      )
      .join("\n")

    const productsSummary = allProducts
      .map(
        (p) =>
          `- ${p.name} (${productStoreMap.get(p._id)}) - $${p.minPrice || "N/A"} - Cantidad: ${p.quantity}`
      )
      .join("\n")

    const systemPrompt = `Eres un asistente de compras experto. Tu tarea es combinar recomendaciones de múltiples supermercados (Lider, Unimarc, Jumbo) y crear un mensaje unificado para el usuario.

Genera un mensaje en español que:
1. Resume las recomendaciones de todos los supermercados
2. Menciona los productos seleccionados y sus tiendas
3. Es conciso pero informativo
4. Ayuda al usuario a entender qué productos están disponibles en cada tienda

Responde SOLO con el texto de la recomendación, sin JSON ni formato adicional.`

    const userPrompt = `Recomendaciones por tienda:
${storesSummary}

Productos seleccionados:
${productsSummary}

Genera un mensaje unificado para el usuario.`

    let unifiedMessage: string
    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ])
      unifiedMessage = (response.content as string).trim()
    } catch (error) {
      console.error("Error generating unified message", error)
      // Fallback to simple concatenation
      unifiedMessage = `He encontrado productos en ${storeRecommendations.length} supermercados. ${storeRecommendations.map((sr) => `${sr.storeName}: ${sr.recommendation.recommendation}`).join(" ")}`
    }

    return {
      recommendation: unifiedMessage,
      selectedProducts: allProducts,
      storeAssignments: productStoreMap,
    }
  }
}
