import { EmbeddingProvider, LLMProvider, EnrichedProduct, RecommendationRequest, RecommendationResult } from "./types"
import { retrieveSimilarProducts, filterByBudget } from "./retrieval"

export class RAGRecommender {
  constructor(private embeddingProvider: EmbeddingProvider, private llmProvider: LLMProvider) {}

  private formatProductForEmbedding(product: EnrichedProduct): string {
    const priceInfo = product.minPrice
      ? `${product.minPrice}–${product.maxPrice} ${product.prices?.[0]?.currency || "USD"}`
      : "price not available"

    return `${product.name} ${product.brand ? `by ${product.brand}` : ""} — ${product.description || ""}. Category: ${product.category}. Tags: ${product.tags.join(", ")}. Price: ${priceInfo}`
  }

  async recommend(
    products: EnrichedProduct[],
    request: RecommendationRequest
  ): Promise<RecommendationResult> {
    if (products.length === 0) {
      return {
        recommendation: "No products available for recommendation.",
        selectedProducts: [],
      }
    }

    const productTexts = products.map((p) => this.formatProductForEmbedding(p))
    const inputs = [request.prompt, ...productTexts]

    const embeddings = await this.embeddingProvider.embed(inputs)

    const queryEmbedding = embeddings[0]
    const productEmbeddings = embeddings.slice(1)

    const k = request.limit ?? 10
    const retrieved = retrieveSimilarProducts(queryEmbedding, products, productEmbeddings, k)

    let filtered = retrieved
    if (request.budget != null) {
      filtered = filterByBudget(filtered, request.budget)
    }

    const filteredProducts = filtered.map((r) => r.product)

    const occasionHint = request.occasion ||
      (request.categories?.length ? `${request.categories.join(", ")} items` : undefined)

    const recommendation = await this.llmProvider.generateRecommendation(
      request.prompt,
      filteredProducts,
      occasionHint
    )

    return recommendation
  }
}
