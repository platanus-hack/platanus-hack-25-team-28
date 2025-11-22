import { v } from "convex/values"
import { api } from "../_generated/api"
import { action, mutation, query } from "../_generated/server"
import { RAGRecommender } from "../rag/recommender"
import { OpenAIEmbeddingProvider } from "../rag/providers/openaiEmbedding"
import { OpenAILLMProvider } from "../rag/providers/openaiLlm"
import { RecommendationRequest } from "../rag/types"
import { ConversationAgent } from "../rag/agents/conversationAgent"
import { RecommendationRefinerAgent } from "../rag/agents/refinementAgent"

export const createConversationSession = mutation({
  args: {
    topic: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("conversation_sessions", {
      userId: args.userId,
      topic: args.topic,
      status: "active",
      messages: [],
      feedbackHistory: [],
      currentRecommendations: [],
      satisfactionLevel: 5,
      refinementCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessageAt: Date.now(),
    })

    return { sessionId }
  },
})

export const getConversationSession = query({
  args: {
    sessionId: v.id("conversation_sessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId)
  },
})

export const addMessageToSession = mutation({
  args: {
    sessionId: v.id("conversation_sessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    analysis: v.optional(
      v.object({
        intent: v.string(),
        sentiment: v.string(),
        entities: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error("Session not found")

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const updatedMessages = [
      ...session.messages,
      {
        id: messageId,
        role: args.role,
        content: args.content,
        timestamp: Date.now(),
        analysis: args.analysis,
      },
    ]

    await ctx.db.patch(args.sessionId, {
      messages: updatedMessages,
      updatedAt: Date.now(),
      lastMessageAt: Date.now(),
    })

    return { messageId, session }
  },
})

export const updateSessionRecommendations = mutation({
  args: {
    sessionId: v.id("conversation_sessions"),
    recommendations: v.array(v.string()),
    satisfactionLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error("Session not found")

    await ctx.db.patch(args.sessionId, {
      currentRecommendations: args.recommendations,
      satisfactionLevel: args.satisfactionLevel ?? session.satisfactionLevel,
      updatedAt: Date.now(),
    })
  },
})

export const addProductFeedback = mutation({
  args: {
    sessionId: v.id("conversation_sessions"),
    productId: v.id("products"),
    productName: v.string(),
    feedback: v.union(v.literal("liked"), v.literal("disliked"), v.literal("interested")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error("Session not found")

    const feedbackEntry = {
      productId: args.productId,
      productName: args.productName,
      feedback: args.feedback,
      reason: args.reason,
      timestamp: Date.now(),
    }

    const updatedFeedback = [...session.feedbackHistory, feedbackEntry]

    await ctx.db.patch(args.sessionId, {
      feedbackHistory: updatedFeedback,
      updatedAt: Date.now(),
    })

    return { feedbackEntry }
  },
})

export const processConversationMessage = action({
  args: {
    sessionId: v.id("conversation_sessions"),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(api.myFunctions.getConversationSession, {
      sessionId: args.sessionId,
    })

    if (!session) throw new Error("Session not found")

    const apiKey = process.env.OPENAI_API_KEY || ""

    const conversationAgent = new ConversationAgent(apiKey)
    const refinementAgent = new RecommendationRefinerAgent(apiKey)

    const analysis = await conversationAgent.analyzeUserMessage(args.userMessage, session.messages)

    await ctx.runMutation(api.myFunctions.addMessageToSession, {
      sessionId: args.sessionId,
      role: "user",
      content: args.userMessage,
      analysis: {
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        entities: analysis.entities,
      },
    })

    let assistantMessage = ""
    let updatedRecommendations: string[] = []

    let prompt = ""
    if (analysis.suggestsRefinement && session.feedbackHistory.length > 0) {
      prompt = await refinementAgent.generateRefinedPrompt({
        originalRequest: session.topic,
        userFeedback: args.userMessage,
        likedProducts: [],
        dislikedProducts: [],
      })
    } else {
      prompt = session.topic + " " + args.userMessage
    }

    const allProducts = await ctx.runQuery(api.myFunctions.listProducts, {})

    const embeddingProvider = new OpenAIEmbeddingProvider(apiKey)
    const llmProvider = new OpenAILLMProvider(apiKey)
    const recommender = new RAGRecommender(embeddingProvider, llmProvider)

    const request: RecommendationRequest = {
      prompt,
      limit: 5,
    }

    const recommendation = await recommender.recommend(allProducts, request)

    updatedRecommendations = recommendation.selectedProducts.map((p) => p._id.toString())
    assistantMessage = recommendation.recommendation

    await ctx.runMutation(api.myFunctions.updateSessionRecommendations, {
      sessionId: args.sessionId,
      recommendations: updatedRecommendations,
      satisfactionLevel: analysis.sentiment === "positive" ? 8 : 5,
    })

    for (const product of recommendation.selectedProducts) {
      const minPrice = product.minPrice || 0
      await ctx.runMutation(api.myFunctions.addToCart, {
        sessionId: args.sessionId,
        productId: product._id,
        productName: product.name,
        brand: product.brand,
        category: product.category,
        quantity: 1,
        unit: product.unit,
        pricePerUnit: minPrice,
        currency: product.prices?.[0]?.currency || "USD",
      })
    }

    await ctx.runMutation(api.myFunctions.addMessageToSession, {
      sessionId: args.sessionId,
      role: "assistant",
      content: assistantMessage,
    })

    return {
      assistantMessage,
      updatedRecommendations,
      analysis,
    }
  },
})
