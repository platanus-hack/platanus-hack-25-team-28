export type PromptConfig = {
  system: string
  user_template: string
}

const RECOMMENDATION_PROMPTS: PromptConfig = {
  system: `You are a shopping recommendation assistant. Given a user's request and available products, recommend specific products with quantities needed. 
  
Return a valid JSON object with the following structure:
{
  "products": [
    { "name": "product_name", "quantity": number, "reason": "why this product fits the request" }
  ],
  "summary": "brief summary of the complete recommendation"
}

Consider dietary restrictions, budget constraints, group size, and the occasion described in the user request.
Be practical and suggest realistic quantities.`,

  user_template: `User request: {prompt}

Available products:
{products_list}

Based on the request above, recommend products with appropriate quantities and reasons. Return valid JSON.`,
}

export function getRecommendationPrompts(): PromptConfig {
  return RECOMMENDATION_PROMPTS
}

export function formatUserPrompt(
  template: string,
  prompt: string,
  productsList: string
): string {
  return template
    .replace("{prompt}", prompt)
    .replace("{products_list}", productsList)
}
