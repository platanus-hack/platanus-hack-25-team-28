import { ChatAnthropic } from "@langchain/anthropic"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ConversationMessage, PromptAnalysis } from "../types"
import { formatTemplate, getPromptAgentConfig } from "../promptLoader"

export class PromptAgent {
  private llm: ChatAnthropic

  constructor(apiKey: string) {
    this.llm = new ChatAnthropic({
      apiKey,
      model: "claude-haiku-4-5-20251001",
      temperature: 0.3,
    })
  }

  private formatHistory(history: ConversationMessage[]): string {
    return history
      .map(
        (m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`
      )
      .join("\n")
  }

  async analyze(
    userMessage: string,
    history: ConversationMessage[] = []
  ): Promise<PromptAnalysis> {
    const promptConfig = getPromptAgentConfig()
    const systemPrompt = promptConfig.system
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
        keywords: [],
        budget: undefined,
      }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const categories = Array.isArray(parsed.categories) ? parsed.categories : []
    const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : []

    const enrichedCategories = expandCategories(
      categories,
      keywords,
      userMessage
    )

    return {
      cleanedPrompt: parsed.cleanedPrompt || userMessage,
      categories: enrichedCategories,
      keywords,
      budget: typeof parsed.budget === "number" ? parsed.budget : undefined,
    }
  }
}

const BEVERAGE_HINTS = [
  "pisco",
  "piscola",
  "cola",
  "coca",
  "bebida",
  "bebidas",
  "trago",
  "licor",
]

function expandCategories(
  categories: string[],
  keywords: string[],
  userMessage: string
): string[] {
  const lowerText = userMessage.toLowerCase()
  const lowerKeywords = keywords.map((k) => k.toLowerCase())
  const set = new Set(categories)

  const mentionsBeverage =
    BEVERAGE_HINTS.some((hint) => lowerText.includes(hint)) ||
    BEVERAGE_HINTS.some((hint) => lowerKeywords.some((k) => k.includes(hint)))

  if (mentionsBeverage) {
    set.add("licores-bebidas-y-aguas")
  }

  return Array.from(set)
}
