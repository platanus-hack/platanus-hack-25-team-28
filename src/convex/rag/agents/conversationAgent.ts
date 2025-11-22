import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ConversationMessage } from "../types"

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

    const systemPrompt = `You are a shopping assistant that analyzes customer messages to understand their intent, sentiment, and needs.

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

suggestsRefinement: True if customer's feedback suggests previous recommendations should be adjusted`

    const userPrompt = `Conversation history:
${historyContext}

Analyze the customer's latest message: "${userMessage}"`

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

    const systemPrompt = `You are a friendly and helpful shopping assistant engaged in a natural conversation with a customer.

Your role:
1. Understand what the customer needs or is feedback on
2. Acknowledge their previous concerns or preferences
3. Ask clarifying questions if needed
4. Provide helpful suggestions or explanations
5. Be conversational and warm, not robotic

${contextualTip}

Keep responses concise (2-3 sentences typically), natural, and focused on helping the customer find what they need.`

    const userPrompt = `Conversation history:
${historyContext}

Customer's message: "${userMessage}"

Respond naturally to continue this conversation.`

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
