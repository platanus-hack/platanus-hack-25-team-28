import { v } from "convex/values"
import { action, query } from "./_generated/server"
import { StoreAgent } from "./rag/agents/storeAgent"
import { EnrichedPrice, EnrichedProduct } from "./rag/types"

export const recommendProducts = action({
  args: {
    userPrompt: v.string(),
    budget: v.optional(v.number()),
    limit: v.optional(v.number()),
    conversationHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY || ""
    const anthropicKey = process.env.ANTHROPIC_API_KEY || ""

    // Run three store agents in parallel
    const liderAgent = new StoreAgent("Lider", apiKey, anthropicKey)
    const unimarcAgent = new StoreAgent("Unimarc", apiKey, anthropicKey)
    const jumboAgent = new StoreAgent("Jumbo", apiKey, anthropicKey)

    const [liderResult, unimarcResult, jumboResult] = await Promise.all([
      liderAgent
        .recommendForStore(ctx, args.userPrompt, args.conversationHistory || [])
        .catch((err) => {
          console.error("Lider agent error:", err)
          return null
        }),
      unimarcAgent
        .recommendForStore(ctx, args.userPrompt, args.conversationHistory || [])
        .catch((err) => {
          console.error("Unimarc agent error:", err)
          return null
        }),
      jumboAgent
        .recommendForStore(ctx, args.userPrompt, args.conversationHistory || [])
        .catch((err) => {
          console.error("Jumbo agent error:", err)
          return null
        }),
    ])

    // Filter out null results (failed agents)
    const storeRecommendations = [
      liderResult,
      unimarcResult,
      jumboResult,
    ].filter((r) => r !== null) as Array<{
      storeName: "Lider" | "Unimarc" | "Jumbo"
      analysis: {
        cleanedPrompt: string
        categories: Array<{ category: string; keywords: string[] }>
        budget?: number
      }
      recommendation: {
        recommendation: string
        selectedProducts: Array<
          EnrichedProduct & { quantity: number; store?: string }
        >
      }
    }>

    // Use decision agent to combine results
    return storeRecommendations.map((rec) => ({
      storeName: rec.storeName,
      analysis: rec.analysis,
      recommendation: rec.recommendation.recommendation,
      selectedProducts: rec.recommendation.selectedProducts.map((p) => ({
        id: p._id,
        name: p.name,
        category: p.category,
        minPrice: p.minPrice,
        maxPrice: p.maxPrice,
        quantity: p.quantity,
        store: rec.storeName,
        imageUrl: p.imageUrl,
        // Add price details for the specific store if needed, or just use the enriched data
        price: p.prices.find((pr) => pr.storeName === rec.storeName)
          ?.currentPrice,
      })),
    }))
  },
})

export const getAllStores = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("stores").collect()
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
