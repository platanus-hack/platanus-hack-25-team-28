import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import {
  EnrichedPrice,
  EnrichedProduct,
  LLMProvider,
  RecommendationResult,
} from "../types"
import { formatTemplate, getRecommendationPromptConfig } from "../promptLoader"

export class OpenAILLMProvider implements LLMProvider {
  private llm: ChatOpenAI

  constructor(apiKey: string) {
    this.llm = new ChatOpenAI({
      apiKey,
      model: "gpt-4o-mini",
      temperature: 0.4,
    })
  }

  async generateRecommendation(
    userQuery: string,
    products: EnrichedProduct[]
  ): Promise<RecommendationResult> {
    const promptConfig = getRecommendationPromptConfig()
    const systemPrompt = promptConfig.system
    const userPrompt = formatTemplate(promptConfig.user_template || "", {
      user_query: userQuery,
      products_context: this.formatProducts(products),
    })

    const response = await this.llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ])
    const content = response.content as string

    return {
      recommendation: content,
      selectedProducts: products.slice(0, 5),
    }
  }

  private formatProducts(products: EnrichedProduct[]): string {
    if (!products.length) return "No hay productos cargados."

    return products
      .map((p) => {
        const priceRange = p.minPrice
          ? `$${p.minPrice.toFixed(0)}–$${p.maxPrice?.toFixed(0) ?? p.minPrice.toFixed(0)}`
          : "precio no disponible"
        const inStock = p.prices?.some((price: EnrichedPrice) => price.inStock)
          ? "En stock"
          : "Sin stock"
        const stores = p.prices
          ?.map(
            (price: EnrichedPrice) =>
              `${price.storeName} ($${price.currentPrice})`
          )
          .join(", ")

        return `- ${p.name} ${p.brand ? `(${p.brand})` : ""} | ${p.category} | ${priceRange} | ${inStock} | ${stores || "sin tienda"}`
      })
      .join("\n")
  }
}
