import {
  EmbeddingProvider,
  EnrichedProduct,
  LLMProvider,
  RecommendationRequest,
  RecommendationResult,
  SimilarityResult,
} from "./types"
import { retrieveSimilarProducts, filterByBudget } from "./retrieval"

export class RAGRecommender {
  constructor(
    private embeddingProvider: EmbeddingProvider,
    private llmProvider: LLMProvider
  ) {}

  private normalizeCategory(category: string): string {
    return category
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  }

  private formatProductForEmbedding(product: EnrichedProduct): string {
    const priceInfo = product.minPrice
      ? `${product.minPrice}–${product.maxPrice ?? product.minPrice} ${product.prices?.[0]?.currency || "USD"}`
      : "sin precio"

    return `${product.name} ${product.brand ? `(${product.brand})` : ""}. Categoria: ${product.category}. Tags: ${product.tags.join(", ")}. Precio: ${priceInfo}. Descripcion: ${product.description || ""}`
  }

  async recommend(
    products: EnrichedProduct[],
    request: RecommendationRequest
  ): Promise<RecommendationResult> {
    if (products.length === 0) {
      return {
        recommendation: "No hay productos disponibles para recomendar.",
        selectedProducts: [],
      }
    }

    const k = request.limit ?? 10
    let pool: SimilarityResult[] = []

    if (request.categories && request.categories.length > 0) {
      for (const catAnalysis of request.categories) {
        // Try to filter by category, handling potential format differences
        let candidates = products.filter(
          (p) =>
            this.normalizeCategory(p.category) ===
            this.normalizeCategory(catAnalysis.category)
        )

        // If no products found in this category, fallback to searching all products
        // This handles cases where the DB category names don't match the agent's fixed list
        if (candidates.length === 0) {
          console.warn(
            `No products found for category '${catAnalysis.category}'. Searching all products.`
          )
          candidates = products
        }

        if (candidates.length === 0) continue

        const productTexts = candidates.map((p) =>
          this.formatProductForEmbedding(p)
        )
        const query = `${request.prompt} ${catAnalysis.keywords.join(" ")}`
        const inputs = [query, ...productTexts]

        const embeddings = await this.embeddingProvider.embed(inputs)
        const queryEmbedding = embeddings[0]
        const productEmbeddings = embeddings.slice(1)

        const retrieved = retrieveSimilarProducts(
          queryEmbedding,
          candidates,
          productEmbeddings,
          k
        )
        pool.push(...retrieved)
      }
    }

    // Fallback if no categories matched or no products found in categories
    if (pool.length === 0) {
      const candidates = products
      const productTexts = candidates.map((p) =>
        this.formatProductForEmbedding(p)
      )
      const inputs = [request.prompt, ...productTexts]

      const embeddings = await this.embeddingProvider.embed(inputs)
      const queryEmbedding = embeddings[0]
      const productEmbeddings = embeddings.slice(1)

      pool = retrieveSimilarProducts(
        queryEmbedding,
        candidates,
        productEmbeddings,
        k * 2
      )
    }

    // Deduplicate by product ID
    const uniqueProducts = new Map<string, SimilarityResult>()
    for (const item of pool) {
      if (!uniqueProducts.has(item.product._id)) {
        uniqueProducts.set(item.product._id, item)
      }
    }
    let finalPool = Array.from(uniqueProducts.values())

    const filteredByBudget =
      request.budget != null
        ? filterByBudget(finalPool, request.budget)
        : finalPool

    finalPool = filteredByBudget.length ? filteredByBudget : finalPool
    const selectedProducts = finalPool.map((r) => r.product)

    const recommendation = await this.llmProvider.generateRecommendation(
      request.prompt,
      selectedProducts
    )
    return recommendation
  }
}
