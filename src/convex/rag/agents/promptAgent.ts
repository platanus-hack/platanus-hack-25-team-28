import { ChatAnthropic } from "@langchain/anthropic"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { CategoryAnalysis, ConversationMessage, PromptAnalysis } from "../types"
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
        budget: undefined,
      }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const categories = Array.isArray(parsed.categories) ? parsed.categories : []

    return {
      cleanedPrompt: parsed.cleanedPrompt || userMessage,
      categories: categories,
      budget: typeof parsed.budget === "number" ? parsed.budget : undefined,
    }
  }
}
