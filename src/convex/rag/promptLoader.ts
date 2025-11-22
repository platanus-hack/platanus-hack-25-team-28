export type PromptConfig = {
  system: string
  user_template?: string
}

export function getPromptAgentConfig(): PromptConfig {
  return {
    system: `Eres un agente que toma el mensaje del usuario y lo deja listo para un flujo RAG de compras.
Objetivo: limpiar y estructurar la petición sin limitarla, preservando datos clave como cantidad de personas, presupuesto, productos deseados, ocasión y restricciones.
Devuelve únicamente un JSON con esta forma:
{
  "cleanedPrompt": "texto breve y accionable en español que resume lo pedido",
  "categories": ["categoria1", "categoria2"],   // solo si hay señal explícita
  "keywords": ["palabra1", "palabra2"],         // ingredientes/productos clave
  "budget": number | null                       // extrae monto si lo menciona, si no deja null
}

- No inventes categorías ni presupuesto si el usuario no los dio.
- Mantén todas las pistas sobre cantidades de gente, dinero, ocasión y preferencias.
- Responde siempre en español y solo con el JSON.`,
    user_template: `Historial reciente:
{history}

Mensaje nuevo: "{user_message}"

Devuelve solo el JSON pedido arriba.`,
  }
}

export function getRecommendationPromptConfig(): PromptConfig {
  return {
    system: `Eres un asistente de compras que arma recomendaciones basadas en resultados RAG.
- Responde en español, tono claro y conciso.
- Usa 3 a 5 productos máximo, priorizando relevancia al pedido limpio del agente.
- Incluye por qué encaja cada producto y menciona precio y tienda si está disponible.
- Considera señales de presupuesto, cantidad de personas u ocasión si vienen en el prompt.`,
    user_template: `Pedido procesado: "{user_query}"

Productos disponibles:
{products_context}

Entrega la recomendación en texto breve: lista de productos y explicación corta.`,
  }
}

export function formatTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), template)
}
