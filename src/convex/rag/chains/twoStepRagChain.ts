import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { EnrichedProduct, EnrichedPrice } from "../types"

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

    const systemPrompt = `You are a helpful shopping assistant that provides personalized product recommendations.
${occasionContext ? `The user is shopping for: ${occasionContext}` : ""}

You have access to the following products and their information:

${contextFormatted}

Guidelines for recommendations:
1. Suggest products that best match the user's request
2. Explain why each product is a good choice
3. Consider budget constraints if mentioned
4. Group recommendations by category when appropriate
5. Mention price ranges and availability
6. Suggest quantities based on the user's needs

Provide clear, helpful recommendations in a conversational tone.`

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
