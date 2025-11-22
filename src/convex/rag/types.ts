import { GenericId } from "convex/values"
import { ProductUnit } from "../schema"

export type StorePrice = {
  storeId: GenericId<"stores">
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

export type Product = {
  _id: GenericId<"products">
  name: string
  brand?: string
  category: string
  quantity: number
  unit: ProductUnit
  tags: string[]
  description?: string
  imageId?: GenericId<"_storage">
  prices?: StorePrice[]
  minPrice?: number
  maxPrice?: number
}

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
