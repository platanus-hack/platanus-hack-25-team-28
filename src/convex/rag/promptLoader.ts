export type PromptConfig = {
  system: string
  user_template?: string
}

export function getPromptAgentConfig(): PromptConfig {
  return {
    system: `Eres un agente experto en categorización de compras de supermercado.
Tu objetivo es analizar el pedido del usuario y mapearlo a una o más de las siguientes categorías fijas:
Tu objetivo es analizar el pedido del usuario y mapearlo a una o más de las siguientes categorías fijas:
{categories_list}

Para cada categoría identificada, genera una lista de palabras clave específicas (ingredientes, productos) que ayuden a buscar en esa categoría.

Devuelve únicamente un JSON con esta estructura:
{
  "cleanedPrompt": "resumen del pedido",
  "categories": [
    {
      "category": "nombre-exacto-de-la-lista",
      "keywords": ["palabra1", "palabra2"]
    }
  ],
  "budget": number | null
}

Reglas:
1. Solo usa las categorías de la lista. Si no encaja en ninguna, no la incluyas.
2. Sé específico con las keywords.
3. Extrae el presupuesto si existe.`,
    user_template: `Historial reciente:
{history}

Mensaje nuevo: "{user_message}"

Devuelve solo el JSON pedido.`,
  }
}

export function getRecommendationPromptConfig(): PromptConfig {
  return {
    system: `Eres un asistente de compras experto.
Tu tarea es seleccionar los mejores productos de la lista disponible para cumplir con el pedido del usuario.

Devuelve un JSON con esta estructura:
{
  "recommendation": "Texto de la recomendación en español, explicando la selección.",
  "selectedProductIds": ["id_producto_1", "id_producto_2"]
}

Reglas:
1. Solo selecciona productos del contexto proporcionado.
2. El texto debe ser útil y mencionar los productos seleccionados.
3. Respeta el presupuesto y restricciones si las hay.`,
    user_template: `Pedido: "{user_query}"

Productos disponibles:
{products_context}

Devuelve el JSON con la recomendación y los IDs de los productos elegidos.`,
  }
}

export function formatTemplate(
  template: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    template
  )
}
