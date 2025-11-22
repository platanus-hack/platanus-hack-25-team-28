import { v } from "convex/values"
import { api } from "./_generated/api"
import { action, mutation, query } from "./_generated/server"
import { RAGRecommender } from "./rag/recommender"
import { OpenAIEmbeddingProvider } from "./rag/providers/openaiEmbedding"
import { OpenAILLMProvider } from "./rag/providers/openaiLlm"
import { Product, RecommendationRequest, PromptAnalysis } from "./rag/types"
import { PromptAnalyzerAgent } from "./rag/agents/promptAnalyzer"

export const listNumbers = query({
  args: {
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const numbers = await ctx.db
      .query("numbers")
      .order("desc")
      .take(args.count)
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    }
  },
})

export const addNumber = mutation({
  args: {
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("numbers", { value: args.value })
    console.log("Added new document with id:", id)
  },
})

export const myAction = action({
  args: {
    first: v.number(),
    second: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    })
    console.log(data)

    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    })
  },
})

export const listProducts = query({
  args: {
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect()

    const enrichedProducts: Product[] = await Promise.all(
      products.map(async (p) => {
        let storeProducts = await ctx.db
          .query("store_products")
          .withIndex("by_product_price", (q) => q.eq("productId", p._id))
          .collect()

        if (args.storeId) {
          storeProducts = storeProducts.filter((sp) => sp.storeId === args.storeId)
        }

        const prices = await Promise.all(
          storeProducts.map(async (sp) => {
            const store = await ctx.db.get(sp.storeId)
            return {
              storeId: sp.storeId,
              storeName: store?.name || "Unknown Store",
              currentPrice: Number(sp.current_price) / 100,
              currency: sp.currency,
              inStock: sp.in_stock,
              sku: sp.sku,
              promotions: sp.promotions,
            }
          })
        )

        const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.currentPrice)) : undefined
        const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.currentPrice)) : undefined

        return {
          _id: p._id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          quantity: p.quantity,
          unit: p.unit,
          tags: p.tags || [],
          description: p.description,
          imageId: p.imageId,
          prices,
          minPrice,
          maxPrice,
        }
      })
    )

    return enrichedProducts
  },
})

export const analyzePrompt = action({
  args: {
    userPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    const analyzerAgent = new PromptAnalyzerAgent(
      process.env.OPENAI_API_KEY || ""
    )
    const analysis = await analyzerAgent.analyzePrompt(args.userPrompt)
    return analysis
  },
})

export const createRecommendationJobMutation = mutation({
  args: {
    userPrompt: v.string(),
    budget: v.optional(v.number()),
    limit: v.optional(v.number()),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("recommendation_jobs", {
      userPrompt: args.userPrompt,
      budget: args.budget,
      limit: args.limit,
      storeId: args.storeId,
      status: "pending",
    })
    return jobId
  },
})

export const updateRecommendationJobMutation = mutation({
  args: {
    jobId: v.id("recommendation_jobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(
      v.object({
        analysis: v.object({
          categories: v.array(v.string()),
          keywords: v.array(v.string()),
          quantity_hint: v.string(),
          occasion: v.string(),
        }),
        recommendation: v.object({
          recommendation: v.string(),
          selectedProducts: v.array(
            v.object({
              _id: v.id("products"),
              name: v.string(),
              category: v.string(),
            })
          ),
        }),
      })
    ),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      result: args.result,
      error: args.error,
      startedAt: args.startedAt,
      completedAt: args.completedAt,
    })
  },
})

export const createRecommendationJob = action({
  args: {
    userPrompt: v.string(),
    budget: v.optional(v.number()),
    limit: v.optional(v.number()),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args): Promise<{ jobId: string }> => {
    const jobId = await ctx.runMutation(api.myFunctions.createRecommendationJobMutation, {
      userPrompt: args.userPrompt,
      budget: args.budget,
      limit: args.limit,
      storeId: args.storeId,
    })

    await ctx.scheduler.runAfter(0, api.myFunctions.processRecommendationJob, {
      jobId,
    })

    return { jobId: jobId as string }
  },
})

export const getRecommendationJob = query({
  args: {
    jobId: v.id("recommendation_jobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    return job
  },
})

export const processRecommendationJob = action({
  args: {
    jobId: v.id("recommendation_jobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(api.myFunctions.getRecommendationJob, {
      jobId: args.jobId,
    })

    if (!job) {
      console.error(`Job ${args.jobId} not found`)
      return
    }

    await ctx.runMutation(api.myFunctions.updateRecommendationJobMutation, {
      jobId: args.jobId,
      status: "processing",
      startedAt: Date.now(),
    })

    try {
      const analyzerAgent = new PromptAnalyzerAgent(
        process.env.OPENAI_API_KEY || ""
      )

      const analysis = await analyzerAgent.analyzePrompt(job.userPrompt)

      let productsResult = await ctx.runQuery(api.myFunctions.listProducts, {
        storeId: job.storeId,
      })

      if (analysis.categories.length > 0) {
        productsResult = productsResult.filter((p: Product) =>
          analysis.categories.includes(p.category)
        )
      }

      const embeddingProvider = new OpenAIEmbeddingProvider(
        process.env.OPENAI_API_KEY || ""
      )
      const llmProvider = new OpenAILLMProvider(
        process.env.OPENAI_API_KEY || ""
      )

      const recommender = new RAGRecommender(embeddingProvider, llmProvider)

      const request: RecommendationRequest = {
        prompt: job.userPrompt,
        budget: job.budget,
        limit: job.limit || 5,
        storeId: job.storeId,
        categories: analysis.categories,
        keywords: analysis.keywords,
        occasion: analysis.occasion,
      }

      const recommendation = await recommender.recommend(productsResult, request)

      const selectedProducts = recommendation.selectedProducts.map((p: Product) => ({
        _id: p._id,
        name: p.name,
        category: p.category,
      }))

      await ctx.runMutation(api.myFunctions.updateRecommendationJobMutation, {
        jobId: args.jobId,
        status: "completed",
        result: {
          analysis,
          recommendation: {
            recommendation: recommendation.recommendation,
            selectedProducts,
          },
        },
        completedAt: Date.now(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Error processing job ${args.jobId}:`, errorMessage)

      await ctx.runMutation(api.myFunctions.updateRecommendationJobMutation, {
        jobId: args.jobId,
        status: "failed",
        error: errorMessage,
        completedAt: Date.now(),
      })
    }
  },
})

export const recommendProducts = action({
  args: {
    userPrompt: v.string(),
    budget: v.optional(v.number()),
    limit: v.optional(v.number()),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.runMutation(api.myFunctions.createRecommendationJobMutation, {
      userPrompt: args.userPrompt,
      budget: args.budget,
      limit: args.limit,
      storeId: args.storeId,
    })

    await ctx.scheduler.runAfter(0, api.myFunctions.processRecommendationJob, {
      jobId,
    })

    return { jobId }
  },
}) as unknown

