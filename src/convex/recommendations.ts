import { v } from "convex/values"
import { api } from "./_generated/api"
import { Id } from "./_generated/dataModel"
import { action, query } from "./_generated/server"
import { PromptAgent } from "./rag/agents/promptAgent"
import { SelectionAgent } from "./rag/agents/selectionAgent"
import { OpenAIEmbeddingProvider } from "./rag/providers/openaiEmbedding"
import { EnrichedPrice, EnrichedProduct, StoreRecommendation } from "./rag/types"

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
    const agent = new PromptAgent(anthropicKey)
    const embeddingProvider = new OpenAIEmbeddingProvider(apiKey)
    const selectionAgent = new SelectionAgent(anthropicKey)

    const stores = await ctx.runQuery(api.recommendations.getAllStores, {})
    const storeRecommendations: StoreRecommendation[] = []

    // Define categories per store
    const storeCategories: Record<string, string[]> = {
      "Jumbo": ["carnes-y-pescados", "frutas-y-verduras", "lacteos-huevos-y-congelados", "quesos-y-fiambres", "despensa", "panaderia-y-pasteleria", "licores-bebidas-y-aguas", "chocolates-galletas-y-snacks"],
      "Lider": ["bebidas", "cerdo", "congelados", "despensa", "frutas y verduras", "lacteos", "licores", "limpieza", "panaderia", "pescados y mariscos", "pollo", "quesos y fiambres", "vacuno"],
      "Unimarc": ["bebidas-y-licores", "carnes", "congelados", "desayuno-y-dulces", "despensa", "frutas-y-verduras", "lacteos-huevos-y-refrigerados", "panaderia-y-pasteleria", "quesos-y-fiambres"]
    }

    await Promise.all(
      stores.map(async (store) => {
        const categories = storeCategories[store.name] || []
        
        // 1. Analyze prompt for this store
        const analysis = await agent.analyze(
          args.userPrompt,
          args.conversationHistory || [],
          categories
        )

        // 2. Vector Search
        const searchResults = new Map<string, number>()
        
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
          const queryEmbedding = (await embeddingProvider.embed([analysis.cleanedPrompt]))[0]
          const results = await ctx.vectorSearch("products", "by_embedding", {
            vector: queryEmbedding,
            limit: 20,
          })
          for (const result of results) {
            searchResults.set(result._id, result._score)
          }
        }

        // 3. Fetch and Filter Products
        const productIds = Array.from(searchResults.keys()) as Id<"products">[]
        const products = await ctx.runQuery(
          api.myFunctions.getEnrichedProductsByIds,
          { ids: productIds }
        )

        const storeProducts = products
          .filter((p) =>
            p.prices.some(
              (price) => price.storeId === store._id && price.inStock
            )
          )
          .map((p) => {
            const storePrice = p.prices.find(
              (price) => price.storeId === store._id
            )!
            return {
              ...p,
              prices: [storePrice],
              minPrice: storePrice.currentPrice,
              maxPrice: storePrice.currentPrice,
            }
          })

        if (storeProducts.length === 0) return

        // 4. Selection Agent
        const recommendation = await selectionAgent.generateRecommendation(
          analysis.cleanedPrompt,
          storeProducts,
          store.name
        )

        const selectedProducts = recommendation.selectedProducts || []
        const totalCost = selectedProducts.reduce(
          (sum, p) => sum + (p.minPrice || 0) * p.quantity,
          0
        )

        storeRecommendations.push({
          storeId: store._id,
          storeName: store.name,
          recommendation: recommendation.recommendation || "Aquí tienes tu recomendación.",
          selectedProducts: selectedProducts.map((p) => ({
            ...p,
            prices: p.prices || [],
          })),
          totalCost,
        })
      })
    )

    return {
      storeRecommendations,
    }
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
