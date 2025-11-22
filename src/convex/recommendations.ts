import { v } from "convex/values"
import { action, query } from "./_generated/server"
import { api } from "./_generated/api"
import { PromptAgent } from "./rag/agents/promptAgent"
import { OpenAIEmbeddingProvider } from "./rag/providers/openaiEmbedding"
import { OpenAILLMProvider } from "./rag/providers/openaiLlm"
import { RAGRecommender } from "./rag/recommender"
import { EnrichedProduct, EnrichedPrice, RecommendationRequest } from "./rag/types"

export const recommendProducts = action({
  args: {
    userPrompt: v.string(),
    budget: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY || ""
    const agent = new PromptAgent(apiKey)
    const analysis = await agent.analyze(args.userPrompt)

    const products = await ctx.runQuery(api.myFunctions.listEnrichedProducts, {
      limit: 200,
    })

    const embeddingProvider = new OpenAIEmbeddingProvider(apiKey)
    const llmProvider = new OpenAILLMProvider(apiKey)
    const recommender = new RAGRecommender(embeddingProvider, llmProvider)

    const request: RecommendationRequest = {
      prompt: analysis.cleanedPrompt,
      budget: args.budget ?? analysis.budget,
      limit: args.limit ?? 5,
      categories: analysis.categories,
      keywords: analysis.keywords,
    }

    const recommendation = await recommender.recommend(products, request)

    return {
      analysis,
      recommendation: recommendation.recommendation,
      selectedProducts: recommendation.selectedProducts.map((p) => ({
        id: p._id,
        name: p.name,
        category: p.category,
        minPrice: p.minPrice,
        maxPrice: p.maxPrice,
      })),
    }
  },
})

export const listEnrichedProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<EnrichedProduct[]> => {
    const take = args.limit ?? 200
    const stores = await ctx.db.query("stores").collect()
    const storeNameById = new Map(stores.map((s) => [s._id, s.name]))

    const products = await ctx.db.query("products").take(take)
    const enriched: EnrichedProduct[] = []

    for (const product of products) {
      const storeProducts = await ctx.db
        .query("store_products")
        .withIndex("by_product_price", (q) => q.eq("productId", product._id))
        .collect()

      const prices: EnrichedPrice[] = storeProducts.map((sp) => ({
        storeId: sp.storeId,
        storeName: storeNameById.get(sp.storeId) || "Tienda",
        currentPrice: Number(sp.current_price),
        currency: sp.currency,
        inStock: sp.in_stock,
        sku: sp.sku,
        promotions: sp.promotions,
      }))

      const minPrice = prices.length ? Math.min(...prices.map((p) => p.currentPrice)) : undefined
      const maxPrice = prices.length ? Math.max(...prices.map((p) => p.currentPrice)) : undefined

      enriched.push({
        ...product,
        prices,
        minPrice,
        maxPrice,
      })
    }

    return enriched
  },
})
