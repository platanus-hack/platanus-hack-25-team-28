import { GenericId } from "convex/values"
import { Doc } from "../_generated/dataModel"

export type StorePrice = Doc<"store_products">

export type Product = Doc<"products">

export type PromptAnalysis = {
  categories: string[]
  keywords: string[]
  quantity_hint: string
  occasion: string
}

export type EmbeddingProvider = {
  embed(texts: string[]): Promise<number[][]>
}

export type LLMProvider = {
  generateRecommendation(
    userQuery: string,
    products: Product[],
    occasionContext?: string
  ): Promise<RecommendationResult>
}

export type RecommendationResult = {
  recommendation: string
  selectedProducts: Product[]
  summary?: string
}

export type RecommendationRequest = {
  prompt: string
  budget?: number
  limit?: number
  storeId?: GenericId<"stores">
  categories?: string[]
  keywords?: string[]
  occasion?: string
}

export type SimilarityResult = {
  index: number
  score: number
  product: Product
}

export type ConversationMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  analysis?: {
    intent: string
    sentiment: string
    entities: string[]
  }
}

export type ProductFeedback = {
  productId: GenericId<"products">
  productName: string
  feedback: "liked" | "disliked" | "interested"
  reason?: string
  timestamp: number
}

export type ConversationSession = {
  _id?: GenericId<"conversation_sessions">
  userId?: string
  topic: string
  status: "active" | "archived"
  messages: ConversationMessage[]
  feedbackHistory: ProductFeedback[]
  currentRecommendations: Product[]
  satisfactionLevel: number
  refinementCount: number
  createdAt: number
  updatedAt: number
  lastMessageAt: number
}

export type ConversationRequest = {
  sessionId: GenericId<"conversation_sessions">
  userMessage: string
}

export type ConversationResponse = {
  assistantMessage: string
  updatedRecommendations: Product[]
  feedback?: {
    intent: string
    sentiment: string
  }
}
