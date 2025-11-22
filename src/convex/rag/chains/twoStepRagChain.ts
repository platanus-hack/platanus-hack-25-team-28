import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { EnrichedProduct, EnrichedPrice } from "../types"
import { getRecommendationPrompts, formatTemplate } from "../promptLoader"

export class TwoStepRAGChain {
  private llm: ChatOpenAI

  constructor(apiKey: string) {
    this.llm = new ChatOpenAI({
      apiKey,
      model: "gpt-4o-mini",
      temperature: 0.3,
    })
  }

  private formatProductsAsContext(products: EnrichedProduct[]): string {
    return products
      .map((p) => {
        const priceRange = p.minPrice
          ? `$${p.minPrice.toFixed(2)}–$${p.maxPrice?.toFixed(2)}`
          : "price unavailable"
        const inStock = p.prices?.some((price: EnrichedPrice) => price.inStock)
          ? "In stock"
          : "Out of stock"
        const stores = p.prices
          ?.map(
            (price: EnrichedPrice) =>
              `${price.storeName} ($${price.currentPrice.toFixed(2)})`
          )
          .join(", ")

        return `
Product: ${p.name}
Brand: ${p.brand || "N/A"}
Category: ${p.category}
Quantity: ${p.quantity}${p.unit}
Price Range: ${priceRange}
Status: ${inStock}
Available at: ${stores || "N/A"}
Tags: ${p.tags.join(", ")}
Description: ${p.description || "No description available"}
`
      })
      .join("\n---\n")
  }

  async generateRecommendation(
    userQuery: string,
    products: EnrichedProduct[],
    occasionContext?: string
  ): Promise<{
    recommendation: string
    selectedProducts: EnrichedProduct[]
  }> {
    const contextFormatted = this.formatProductsAsContext(products)
    const prompts = getRecommendationPrompts()

    const systemPrompt = formatTemplate(prompts.generate_recommendation.system, {
      occasion_context: occasionContext
        ? `The user is shopping for: ${occasionContext}`
        : "",
      context_formatted: contextFormatted,
    })

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userQuery),
      ])

      const content = response.content as string

      const selectedProductNames = products
        .filter((p) => content.toLowerCase().includes(p.name.toLowerCase()))
        .slice(0, 5)

      return {
        recommendation: content,
        selectedProducts: selectedProductNames,
      }
    } catch (error) {
      console.error("Error generating recommendation:", error)
      return {
        recommendation:
          "I encountered an error while processing your request. Please try again.",
        selectedProducts: [],
      }
    }
  }
}
