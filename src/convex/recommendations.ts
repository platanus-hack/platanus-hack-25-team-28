import { v } from "convex/values"
import { action, query } from "./_generated/server"
import { api } from "./_generated/api"
import { Id } from "./_generated/dataModel"
import { PromptAgent } from "./rag/agents/promptAgent"
import { OpenAIEmbeddingProvider } from "./rag/providers/openaiEmbedding"
import { SelectionAgent } from "./rag/agents/selectionAgent"
import {
  EnrichedProduct,
  EnrichedPrice,
  RecommendationRequest,
} from "./rag/types"

export const recommendProducts = action({
  args: {
    userPrompt: v.string(),
    budget: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY || ""
    const anthropicKey = process.env.ANTHROPIC_API_KEY || ""
    const agent = new PromptAgent(anthropicKey)
    const analysis = await agent.analyze(args.userPrompt)
    const embeddingProvider = new OpenAIEmbeddingProvider(apiKey)

    // 1. Generate embeddings for queries (one per category)
    const searchResults = new Map<string, number>() // productId -> score

    if (analysis.categories.length > 0) {
      for (const catAnalysis of analysis.categories) {
        // Use category and keywords for a focused search query
        // This prevents "bleeding" of context (e.g. "meat" in prompt affecting "beers" search)
        const queryText = `${catAnalysis.category} ${catAnalysis.keywords.join(" ")}`
        const queryEmbedding = (await embeddingProvider.embed([queryText]))[0]

        // 2. Perform Vector Search per category
        // Note: We use the normalized category name if possible, but vector search filter expects exact match.
        // If DB categories are capitalized (e.g. "Meat"), and agent returns "carnes-y-pescados", we have a mismatch.
        // We need to map agent categories to DB categories or rely on semantic search without filter if mismatch.
        // For now, let's try to map or just search without filter if we can't map.
        // Actually, the previous fallback logic suggests we might just want to search globally if we are unsure.
        // But let's try to use the filter if we can.
        // Given the mismatch issues seen before, let's do a global vector search but boost/filter in post-processing?
        // No, vector search is most effective with filters.

        // Let's assume for now we search globally but use the keywords to guide it.
        // Or we can try to map the agent category to the DB category.
        // Since we don't have a reliable map, let's do a global search for each query.

        const results = await ctx.vectorSearch("products", "by_embedding", {
          vector: queryEmbedding,
          limit: 10,
          // filter: (q) => q.eq("category", catAnalysis.category) // Disabled due to mismatch risk
        })

        for (const result of results) {
          const existingScore = searchResults.get(result._id) || 0
          // Keep the highest score if found multiple times
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

    // 3. Fetch full product details
    const productIds = Array.from(searchResults.keys()) as Id<"products">[]
    const products = await ctx.runQuery(
      api.myFunctions.getEnrichedProductsByIds,
      {
        ids: productIds,
      }
    )

    // 4. Selection Agent
    const selectionAgent = new SelectionAgent(anthropicKey)
    const recommendation = await selectionAgent.generateRecommendation(
      analysis.cleanedPrompt,
      products
    )

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

export const getEnrichedProductsByIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const products = []
    for (const id of args.ids) {
      const product = await ctx.db.get(id)
      if (product) products.push(product)
    }

    // Reuse the enrichment logic
    // For brevity, I'll duplicate the enrichment logic here or refactor.
    // Let's refactor listEnrichedProducts to use a helper or just copy for now to be safe.

    const stores = await ctx.db.query("stores").collect()
    const storeNameById = new Map(stores.map((s) => [s._id, s.name]))
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

      const minPrice = prices.length
        ? Math.min(...prices.map((p) => p.currentPrice))
        : undefined
      const maxPrice = prices.length
        ? Math.max(...prices.map((p) => p.currentPrice))
        : undefined

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

      const minPrice = prices.length
        ? Math.min(...prices.map((p) => p.currentPrice))
        : undefined
      const maxPrice = prices.length
        ? Math.max(...prices.map((p) => p.currentPrice))
        : undefined

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
