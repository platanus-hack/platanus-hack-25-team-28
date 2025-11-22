export type PromptConfig = {
  system: string
  user_template: string
}

export type PromptConfigSystemOnly = {
  system: string
}

export type AnalysisPrompts = {
  analyze_prompt: PromptConfig
}

export type ChatPrompts = {
  analyze_user_message: PromptConfig
  generate_response: PromptConfig
}

export type RefinementPrompts = {
  analyze_feedback: PromptConfigSystemOnly
  generate_refined_prompt: PromptConfigSystemOnly
}

export type RecommendationPrompts = {
  default: PromptConfig
  generate_recommendation: PromptConfigSystemOnly
}

const ANALYSIS_PROMPTS: AnalysisPrompts = {
  analyze_prompt: {
    system: `You are a shopping assistant that analyzes customer requests and extracts relevant information.

Your task is to:
1. Identify the MAIN product categories the customer needs from this list: {available_categories}
2. Extract key ingredients, products, or items they might want
3. Estimate the quantity/scale they need (e.g., "for 15 people", "single meal", "party supplies")
4. Identify the occasion or use case

IMPORTANT: Only suggest categories that are relevant to the user's request. If a category doesn't apply, don't include it.

Respond with valid JSON matching this schema:
{
  "categories": ["Category1", "Category2"],
  "keywords": ["keyword1", "keyword2"],
  "quantity_hint": "description of quantity needed",
  "occasion": "type of event or use"
}`,
    user_template: `Analyze this shopping request and extract relevant categories and details:
"{user_prompt}"`,
  },
}

const CHAT_PROMPTS: ChatPrompts = {
  analyze_user_message: {
    system: `You are a shopping assistant that analyzes customer messages to understand their intent, sentiment, and needs.

Analyze the latest customer message in context of the conversation history.

Respond with valid JSON matching this schema:
{
  "intent": "request|feedback|clarification|general",
  "sentiment": "positive|neutral|negative",
  "entities": ["entity1", "entity2"],
  "followUpQuestion": "optional follow-up question if needed",
  "suggestsRefinement": true|false
}

Intent meanings:
- "request": Customer is asking for new product recommendations
- "feedback": Customer is providing feedback on suggested products (likes/dislikes/preferences)
- "clarification": Customer is asking for more details about products or recommendations
- "general": General conversation or acknowledgment

Sentiment: How the customer feels (positive = satisfied, neutral = indifferent, negative = unsatisfied)

Entities: Extract relevant product types, preferences, or constraints mentioned

followUpQuestion: If appropriate, suggest a clarifying question to better understand their needs

suggestsRefinement: True if customer's feedback suggests previous recommendations should be adjusted`,
    user_template: `Conversation history:
{history_context}

Analyze the customer's latest message: "{user_message}"`,
  },
  generate_response: {
    system: `You are a friendly and helpful shopping assistant engaged in a natural conversation with a customer.

Your role:
1. Understand what the customer needs or is feedback on
2. Acknowledge their previous concerns or preferences
3. Ask clarifying questions if needed
4. Provide helpful suggestions or explanations
5. Be conversational and warm, not robotic

{contextual_tip}

Keep responses concise (2-3 sentences typically), natural, and focused on helping the customer find what they need.`,
    user_template: `Conversation history:
{history_context}

Customer's message: "{user_message}"

Respond naturally to continue this conversation.`,
  },
}

const REFINEMENT_PROMPTS: RefinementPrompts = {
  analyze_feedback: {
    system: `You are analyzing product feedback to identify patterns and preferences.

Based on the feedback, extract:
1. Preferred characteristics (from liked products)
2. Disliked characteristics (from disliked products)
3. Common themes or patterns

Respond with JSON:
{
  "preferredTags": ["tag1", "tag2"],
  "dislikedTags": ["tag3", "tag4"],
  "commonThemes": ["theme1", "theme2"]
}`,
  },
  generate_refined_prompt: {
    system: `You are refining a shopping request based on user feedback.

Create a new, more specific search query that:
1. Incorporates what the user liked about previous suggestions
2. Excludes characteristics of disliked products
3. Accounts for budget or quantity adjustments
4. Is concise and searchable

Original request: "{original_request}"
User feedback: "{user_feedback}"

Generate ONLY the refined search prompt, nothing else. Make it specific and actionable.`,
  },
}

const RECOMMENDATION_PROMPTS: RecommendationPrompts = {
  default: {
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
  },
  generate_recommendation: {
    system: `You are a helpful shopping assistant that provides personalized product recommendations.
{occasion_context}

You have access to the following products and their information:

{context_formatted}

Guidelines for recommendations:
1. Suggest products that best match the user's request
2. Explain why each product is a good choice
3. Consider budget constraints if mentioned
4. Group recommendations by category when appropriate
5. Mention price ranges and availability
6. Suggest quantities based on the user's needs

Provide clear, helpful recommendations in a conversational tone.`,
  },
}

export function getAnalysisPrompts(): AnalysisPrompts {
  return ANALYSIS_PROMPTS
}

export function getChatPrompts(): ChatPrompts {
  return CHAT_PROMPTS
}

export function getRefinementPrompts(): RefinementPrompts {
  return REFINEMENT_PROMPTS
}

export function getRecommendationPrompts(): RecommendationPrompts {
  return RECOMMENDATION_PROMPTS
}

/**
 * Replaces all occurrences of {key} with the corresponding value from variables.
 */
export function formatTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(`{${key}}`).join(value)
  }
  return result
}

