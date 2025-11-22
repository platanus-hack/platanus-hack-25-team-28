import { GenericId } from "convex/values"
import { Doc, Id } from "../_generated/dataModel"

export type Product = Doc<"products">

export type EnrichedPrice = {
  storeId: Id<"stores">
  storeName: string
  currentPrice: number
  currency: string
  inStock: boolean
  sku?: string
  promotions?: {
    type: string
    description: string
  }
}

export type EnrichedProduct = Omit<Product, "_creationTime"> & {
  prices: EnrichedPrice[]
  minPrice?: number
  maxPrice?: number
}

export type PromptAnalysis = {
  cleanedPrompt: string
  categories: string[]
  keywords: string[]
  budget?: number
}

export type EmbeddingProvider = {
  embed(texts: string[]): Promise<number[][]>
}

export type LLMProvider = {
  generateRecommendation(
    userQuery: string,
    products: EnrichedProduct[]
  ): Promise<RecommendationResult>
}

export type RecommendationResult = {
  recommendation: string
  selectedProducts: EnrichedProduct[]
}

export type RecommendationRequest = {
  prompt: string
  budget?: number
  limit?: number
  categories?: string[]
  keywords?: string[]
}

export type SimilarityResult = {
  index: number
  score: number
  product: EnrichedProduct
}

export type ConversationMessage = {
  id?: string
  role: "user" | "assistant"
  content: string
  timestamp?: number
}
