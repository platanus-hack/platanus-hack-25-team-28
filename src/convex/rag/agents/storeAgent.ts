import { api } from "../../_generated/api"
import { Id } from "../../_generated/dataModel"
import { ActionCtx } from "../../_generated/server"
import { OpenAIEmbeddingProvider } from "../providers/openaiEmbedding"
import { StoreName } from "../storeConfig"
import { EnrichedPrice, EnrichedProduct, PromptAnalysis, RecommendationResult } from "../types"
import { PromptAgent } from "./promptAgent"
import { SelectionAgent } from "./selectionAgent"

export class StoreAgent {
  private storeName: StoreName
  private apiKey: string
  private anthropicKey: string

  constructor(
    storeName: StoreName,
    apiKey: string,
    anthropicKey: string
  ) {
    this.storeName = storeName
    this.apiKey = apiKey
    this.anthropicKey = anthropicKey
  }

  async recommendForStore(
    ctx: ActionCtx,
    userPrompt: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
  ): Promise<{
    analysis: PromptAnalysis
    recommendation: RecommendationResult
    storeName: StoreName
  }> {
    // 1. Use store-specific PromptAgent
    const promptAgent = new PromptAgent(this.anthropicKey, this.storeName)
    const analysis = await promptAgent.analyze(
      userPrompt,
      conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    )

    // 2. Get store ID
    const storeIds = await ctx.runQuery(api.rag.storeUtils.getStoreIds, {})
    const storeId = storeIds[this.storeName]
    if (!storeId) {
      throw new Error(`Store ${this.storeName} not found in database`)
    }

    // 3. Generate embeddings and search products
    const embeddingProvider = new OpenAIEmbeddingProvider(this.apiKey)
    const searchResults = new Map<string, number>() // productId -> score

    if (analysis.categories.length > 0) {
      for (const catAnalysis of analysis.categories) {
        const queryText = `${catAnalysis.category} ${catAnalysis.keywords.join(" ")}`
        const queryEmbedding = (await embeddingProvider.embed([queryText]))[0]

        const results = await ctx.vectorSearch("products", "by_embedding", {
          vector: queryEmbedding,
          limit: 10,
        })

        for (const result of results) {
          const existingScore = searchResults.get(result._id) || 0
          if (result._score > existingScore) {
            searchResults.set(result._id, result._score)
          }
        }
      }
    } else {
      // Fallback: Global search with just the prompt
      const queryEmbedding = (
        await embeddingProvider.embed([analysis.cleanedPrompt])
      )[0]
      const results = await ctx.vectorSearch("products", "by_embedding", {
        vector: queryEmbedding,
        limit: 20,
      })
      for (const result of results) {
        searchResults.set(result._id, result._score)
      }
    }

    // 4. Fetch full product details and filter by store
    const productIds = Array.from(searchResults.keys()) as Id<"products">[]
    const allProducts = await ctx.runQuery(api.recommendations.getEnrichedProductsByIds, {
      ids: productIds,
    })

    // Filter products to only include those available in this store
    const storeProducts = allProducts.filter((product: EnrichedProduct) =>
      product.prices.some((price: EnrichedPrice) => price.storeId === storeId && price.inStock)
    )

    // 5. Selection Agent
    const selectionAgent = new SelectionAgent(this.anthropicKey)
    const recommendation = await selectionAgent.generateRecommendation(
      analysis.cleanedPrompt,
      storeProducts
    )

    // 6. Add store name to each product (store as string for frontend compatibility)
    const productsWithStore = recommendation.selectedProducts.map((p) => ({
      ...p,
      store: this.storeName as string,
    }))

    return {
      analysis,
      recommendation: {
        ...recommendation,
        selectedProducts: productsWithStore,
      },
      storeName: this.storeName,
    }
  }
}

