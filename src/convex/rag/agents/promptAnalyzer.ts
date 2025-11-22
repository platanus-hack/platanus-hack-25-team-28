import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getAnalysisPrompts, formatTemplate } from "../promptLoader"

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
    const prompts = getAnalysisPrompts()
    const systemPrompt = formatTemplate(prompts.analyze_prompt.system, {
      available_categories: AVAILABLE_CATEGORIES.join(", "),
    })

    const userMessage = formatTemplate(prompts.analyze_prompt.user_template, {
      user_prompt: userPrompt,
    })

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
        quantity_hint:
          typeof parsed.quantity_hint === "string"
            ? parsed.quantity_hint
            : "unknown",
        occasion:
          typeof parsed.occasion === "string"
            ? parsed.occasion
            : "general shopping",
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
