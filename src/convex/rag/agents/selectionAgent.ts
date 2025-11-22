import { ChatAnthropic } from "@langchain/anthropic"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { EnrichedProduct, RecommendationResult } from "../types"
import { getRecommendationPromptConfig, formatTemplate } from "../promptLoader"

export class SelectionAgent {
  private llm: ChatAnthropic

  constructor(apiKey: string) {
    this.llm = new ChatAnthropic({
      apiKey,
      model: "claude-haiku-4-5-20251001",
      temperature: 0.4,
    })
  }

  async generateRecommendation(
    userQuery: string,
    products: EnrichedProduct[]
  ): Promise<RecommendationResult> {
    const promptConfig = getRecommendationPromptConfig()
    const systemPrompt = promptConfig.system

    const productsContext = products
      .map(
        (p) =>
          `- [ID: ${p._id}] ${p.name} (${p.brand || "generico"}): $${p.minPrice}. ${p.description || ""}`
      )
      .join("\n")

    const userPrompt = formatTemplate(promptConfig.user_template || "", {
      user_query: userQuery,
      products_context: productsContext,
    })

    const response = await this.llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ])

    const content = response.content as string
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      // Fallback if JSON parsing fails
      return {
        recommendation: content,
        selectedProducts: products,
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      const selectedIds = Array.isArray(parsed.selectedProductIds)
        ? parsed.selectedProductIds
        : []

      const selectedProducts = products.filter((p) =>
        selectedIds.includes(p._id)
      )

      return {
        recommendation:
          parsed.recommendation || "Aquí tienes tu recomendación.",
        selectedProducts:
          selectedProducts.length > 0 ? selectedProducts : products,
      }
    } catch (e) {
      console.error("Error parsing selection agent response", e)
      return {
        recommendation: content,
        selectedProducts: products,
      }
    }
  }
}
