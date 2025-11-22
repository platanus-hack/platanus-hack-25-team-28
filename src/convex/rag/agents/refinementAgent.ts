import { Product, ProductFeedback } from "../types"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

export type RefinementRequest = {
  originalRequest: string
  userFeedback: string
  likedProducts: Product[]
  dislikedProducts: Product[]
  currentBudget?: number
  adjustedQuantity?: string
}

export type RefinementResult = {
  refinedPrompt: string
  strategy: string
  updatedRecommendations?: Product[]
}

export class RecommendationRefinerAgent {
  private llm: ChatOpenAI

  constructor(apiKey: string) {
    this.llm = new ChatOpenAI({
      apiKey,
      model: "gpt-4o-mini",
      temperature: 0.5,
    })
  }

  async analyzeFeedback(feedbackHistory: ProductFeedback[]): Promise<{
    preferredTags: string[]
    dislikedTags: string[]
    commonThemes: string[]
  }> {
    const liked = feedbackHistory.filter((f) => f.feedback === "liked")
    const disliked = feedbackHistory.filter((f) => f.feedback === "disliked")

    const systemPrompt = `You are analyzing product feedback to identify patterns and preferences.

Based on the feedback, extract:
1. Preferred characteristics (from liked products)
2. Disliked characteristics (from disliked products)
3. Common themes or patterns

Respond with JSON:
{
  "preferredTags": ["tag1", "tag2"],
  "dislikedTags": ["tag3", "tag4"],
  "commonThemes": ["theme1", "theme2"]
}`

    const feedbackText = `Liked products: ${liked.map((f) => f.productName).join(", ") || "None"}
Disliked products: ${disliked.map((f) => f.productName).join(", ") || "None"}`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(feedbackText),
      ])

      const content = response.content as string
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        return {
          preferredTags: [],
          dislikedTags: [],
          commonThemes: [],
        }
      }

      const parsed = JSON.parse(jsonMatch[0])
      return {
        preferredTags: Array.isArray(parsed.preferredTags) ? parsed.preferredTags : [],
        dislikedTags: Array.isArray(parsed.dislikedTags) ? parsed.dislikedTags : [],
        commonThemes: Array.isArray(parsed.commonThemes) ? parsed.commonThemes : [],
      }
    } catch (error) {
      console.error("Error analyzing feedback:", error)
      return {
        preferredTags: [],
        dislikedTags: [],
        commonThemes: [],
      }
    }
  }

  async generateRefinedPrompt(request: RefinementRequest): Promise<string> {
    const systemPrompt = `You are refining a shopping request based on user feedback.

Create a new, more specific search query that:
1. Incorporates what the user liked about previous suggestions
2. Excludes characteristics of disliked products
3. Accounts for budget or quantity adjustments
4. Is concise and searchable

Original request: "${request.originalRequest}"
User feedback: "${request.userFeedback}"

Generate ONLY the refined search prompt, nothing else. Make it specific and actionable.`

    const context = []
    if (request.likedProducts.length > 0) {
      context.push(`Liked: ${request.likedProducts.map((p) => p.name).join(", ")}`)
    }
    if (request.dislikedProducts.length > 0) {
      context.push(`Disliked: ${request.dislikedProducts.map((p) => p.name).join(", ")}`)
    }
    if (request.currentBudget) {
      context.push(`Budget: $${request.currentBudget}`)
    }
    if (request.adjustedQuantity) {
      context.push(`Quantity: ${request.adjustedQuantity}`)
    }

    const contextStr = context.join("\n")

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(contextStr),
      ])

      return (response.content as string).trim()
    } catch (error) {
      console.error("Error generating refined prompt:", error)
      return request.originalRequest
    }
  }

  async strategyRecommendation(feedbackHistory: ProductFeedback[]): Promise<string> {
    const analysis = await this.analyzeFeedback(feedbackHistory)

    if (analysis.dislikedTags.length > analysis.preferredTags.length) {
      return "exclude"
    } else if (analysis.preferredTags.length > 3) {
      return "focus"
    } else if (feedbackHistory.length < 3) {
      return "expand"
    }
    return "refine"
  }

  async filterProductsByFeedback(
    products: Product[],
    feedbackHistory: ProductFeedback[]
  ): Promise<Product[]> {
    const analysis = await this.analyzeFeedback(feedbackHistory)

    const likedTags = new Set(analysis.preferredTags)
    const dislikedTags = new Set(analysis.dislikedTags)

    const scored = products.map((p) => {
      let score = 0
      const productTags = new Set(p.tags)

      for (const tag of likedTags) {
        if (productTags.has(tag)) score += 2
      }

      for (const tag of dislikedTags) {
        if (productTags.has(tag)) score -= 3
      }

      return { product: p, score }
    })

    return scored.filter((s) => s.score >= 0).sort((a, b) => b.score - a.score).map((s) => s.product)
  }
}
