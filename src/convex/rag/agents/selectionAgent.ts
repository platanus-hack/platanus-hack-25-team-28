import { ChatAnthropic } from "@langchain/anthropic"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { formatTemplate, getRecommendationPromptConfig } from "../promptLoader"
import { EnrichedProduct, RecommendationResult } from "../types"

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
    products: EnrichedProduct[],
    storeName?: string
  ): Promise<RecommendationResult> {
    const promptConfig = getRecommendationPromptConfig()
    const systemPrompt = promptConfig.system + "\nIMPORTANT: When selecting products, you MUST specify the quantity for each product based on the user's request. If not specified, default to 1. Your response for selectedProductIds must be an array of objects: { id: string, quantity: number }."

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
        selectedProducts: products.map((p) => ({ ...p, quantity: 1 })),
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      const selectedItems = Array.isArray(parsed.selectedProductIds)
        ? parsed.selectedProductIds
        : []

      // Handle both old format (string[]) and new format ({id, quantity}[])
      const normalizedSelection = selectedItems.map((item: any) => {
        if (typeof item === 'string') {
          return { id: item, quantity: 1 }
        }
        return { id: item.id, quantity: item.quantity || 1 }
      })

      const selectedProducts = products
        .filter((p) => normalizedSelection.some((s: any) => s.id === p._id))
        .map(p => {
          const selection = normalizedSelection.find((s: any) => s.id === p._id)
          return {
            ...p,
            quantity: selection ? selection.quantity : 1
          }
        })

      return {
        recommendation:
          parsed.recommendation || "Aquí tienes tu recomendación.",
        selectedProducts:
          selectedProducts.length > 0 ? selectedProducts : products.map(p => ({ ...p, quantity: 1 })),
      }
    } catch (e) {
      console.error("Error parsing selection agent response", e)
      return {
        recommendation: content,
        selectedProducts: products.map(p => ({ ...p, quantity: 1 })),
      }
    }
  }
}
