import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ConversationMessage } from "../types"
import { getChatPrompts, formatTemplate } from "../promptLoader"

export type IntentAnalysis = {
  intent: "request" | "feedback" | "clarification" | "general"
  sentiment: "positive" | "neutral" | "negative"
  entities: string[]
  followUpQuestion?: string
  suggestsRefinement: boolean
}

export class ConversationAgent {
  private llm: ChatOpenAI

  constructor(apiKey: string) {
    this.llm = new ChatOpenAI({
      apiKey,
      model: "gpt-4o-mini",
      temperature: 0.7,
    })
  }

  private formatConversationHistory(messages: ConversationMessage[]): string {
    return messages
      .map((msg) => {
        const role = msg.role === "user" ? "Customer" : "Assistant"
        return `${role}: ${msg.content}`
      })
      .join("\n")
  }

  async analyzeUserMessage(
    userMessage: string,
    conversationHistory: ConversationMessage[]
  ): Promise<IntentAnalysis> {
    const historyContext = this.formatConversationHistory(
      conversationHistory.slice(-6)
    )
    const prompts = getChatPrompts()

    const systemPrompt = prompts.analyze_user_message.system

    const userPrompt = formatTemplate(prompts.analyze_user_message.user_template, {
      history_context: historyContext,
      user_message: userMessage,
    })

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ])

      const content = response.content as string
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        return {
          intent: "general",
          sentiment: "neutral",
          entities: [],
          suggestsRefinement: false,
        }
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        intent: parsed.intent || "general",
        sentiment: parsed.sentiment || "neutral",
        entities: Array.isArray(parsed.entities) ? parsed.entities : [],
        followUpQuestion: parsed.followUpQuestion,
        suggestsRefinement: parsed.suggestsRefinement === true,
      }
    } catch (error) {
      console.error("Error analyzing user message:", error)
      return {
        intent: "general",
        sentiment: "neutral",
        entities: [],
        suggestsRefinement: false,
      }
    }
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: ConversationMessage[],
    currentRecommendations?: string[],
    satisfactionLevel?: number
  ): Promise<string> {
    const historyContext = this.formatConversationHistory(
      conversationHistory.slice(-8)
    )

    let contextualTip = ""
    if (satisfactionLevel !== undefined) {
      if (satisfactionLevel >= 8) {
        contextualTip =
          "The customer seems very satisfied with recent recommendations. Maintain the current direction."
      } else if (satisfactionLevel <= 4) {
        contextualTip =
          "The customer is not satisfied with current recommendations. Be open to trying new approaches."
      } else {
        contextualTip =
          "The customer has mixed feelings. Ask clarifying questions to better understand."
      }
    }

    const prompts = getChatPrompts()
    const systemPrompt = formatTemplate(prompts.generate_response.system, {
      contextual_tip: contextualTip,
    })

    const userPrompt = formatTemplate(prompts.generate_response.user_template, {
      history_context: historyContext,
      user_message: userMessage,
    })

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ])

      return response.content as string
    } catch (error) {
      console.error("Error generating response:", error)
      return "I apologize, I'm having trouble processing your message. Could you please rephrase that?"
    }
  }
}
