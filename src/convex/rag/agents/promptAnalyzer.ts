import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

export type AnalysisResult = {
  categories: string[]
  keywords: string[]
  quantity_hint: string
  occasion: string
}

const AVAILABLE_CATEGORIES = [
  "Dairy",
  "Meat",
  "Bakery",
  "Beverages",
  "Snacks",
  "Produce",
  "Canned Goods",
  "Frozen",
  "Organic",
  "Health Foods",
]

export class PromptAnalyzerAgent {
  private llm: ChatOpenAI

  constructor(apiKey: string) {
    this.llm = new ChatOpenAI({
      apiKey,
      model: "gpt-4o-mini",
      temperature: 0.3,
    })
  }

  async analyzePrompt(userPrompt: string): Promise<AnalysisResult> {
    const systemPrompt = `You are a shopping assistant that analyzes customer requests and extracts relevant information.

Your task is to:
1. Identify the MAIN product categories the customer needs from this list: ${AVAILABLE_CATEGORIES.join(", ")}
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
}`

    const userMessage = `Analyze this shopping request and extract relevant categories and details:
"${userPrompt}"`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ])

      const content = response.content as string

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from response")
      }

      const parsed = JSON.parse(jsonMatch[0])
      const validated: AnalysisResult = {
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        quantity_hint: typeof parsed.quantity_hint === "string" ? parsed.quantity_hint : "unknown",
        occasion: typeof parsed.occasion === "string" ? parsed.occasion : "general shopping",
      }

      return validated
    } catch (error) {
      console.error("Error analyzing prompt:", error)
      return {
        categories: [],
        keywords: [],
        quantity_hint: "unknown",
        occasion: "general shopping",
      }
    }
  }
}
