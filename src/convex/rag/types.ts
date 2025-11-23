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

export type CategoryAnalysis = {
  category: string
  keywords: string[]
}

export type PromptAnalysis = {
  cleanedPrompt: string
  categories: CategoryAnalysis[]
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

export type SelectedProduct = EnrichedProduct & {
  quantity: number
}

export type RecommendationResult = {
  recommendation: string
  selectedProducts: SelectedProduct[]
}

export type RecommendationRequest = {
  prompt: string
  budget?: number
  limit?: number
  categories?: CategoryAnalysis[]
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

export type StoreRecommendation = {
  storeId: Id<"stores">
  storeName: string
  recommendation: string
  selectedProducts: SelectedProduct[]
  totalCost: number
}
