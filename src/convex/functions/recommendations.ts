import { v } from "convex/values"
import { api } from "../_generated/api"
import { action, mutation, query } from "../_generated/server"
import { RAGRecommender } from "../rag/recommender"
import { OpenAIEmbeddingProvider } from "../rag/providers/openaiEmbedding"
import { OpenAILLMProvider } from "../rag/providers/openaiLlm"
import { EnrichedProduct, Product, RecommendationRequest } from "../rag/types"
import { PromptAnalyzerAgent } from "../rag/agents/promptAnalyzer"

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
        productsResult = productsResult.filter((p: EnrichedProduct) =>
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

      const recommendation = await recommender.recommend(
        productsResult,
        request
      )

      const selectedProducts = recommendation.selectedProducts.map(
        (p: EnrichedProduct) => ({
          _id: p._id,
          name: p.name,
          category: p.category,
        })
      )

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
      const errorMessage =
        error instanceof Error ? error.message : String(error)
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

export const createRecommendationJob = action({
  args: {
    userPrompt: v.string(),
    budget: v.optional(v.number()),
    limit: v.optional(v.number()),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args): Promise<{ jobId: string }> => {
    const jobId = await ctx.runMutation(
      api.myFunctions.createRecommendationJobMutation,
      {
        userPrompt: args.userPrompt,
        budget: args.budget,
        limit: args.limit,
        storeId: args.storeId,
      }
    )

    await ctx.scheduler.runAfter(0, api.myFunctions.processRecommendationJob, {
      jobId,
    })

    return { jobId: jobId as string }
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
    const jobId = await ctx.runMutation(
      api.myFunctions.createRecommendationJobMutation,
      {
        userPrompt: args.userPrompt,
        budget: args.budget,
        limit: args.limit,
        storeId: args.storeId,
      }
    )

    await ctx.scheduler.runAfter(0, api.myFunctions.processRecommendationJob, {
      jobId,
    })

    return { jobId }
  },
}) as unknown
