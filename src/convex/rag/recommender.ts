import { EmbeddingProvider, EnrichedProduct, LLMProvider, RecommendationRequest, RecommendationResult } from "./types"
import { retrieveSimilarProducts, filterByBudget } from "./retrieval"

export class RAGRecommender {
  constructor(private embeddingProvider: EmbeddingProvider, private llmProvider: LLMProvider) {}

  private formatProductForEmbedding(product: EnrichedProduct): string {
    const priceInfo = product.minPrice
      ? `${product.minPrice}–${product.maxPrice ?? product.minPrice} ${product.prices?.[0]?.currency || "USD"}`
      : "sin precio"

    return `${product.name} ${product.brand ? `(${product.brand})` : ""}. Categoria: ${product.category}. Tags: ${product.tags.join(", ")}. Precio: ${priceInfo}. Descripcion: ${product.description || ""}`
  }

  async recommend(products: EnrichedProduct[], request: RecommendationRequest): Promise<RecommendationResult> {
    if (products.length === 0) {
      return {
        recommendation: "No hay productos disponibles para recomendar.",
        selectedProducts: [],
      }
    }

    let candidates =
      request.categories && request.categories.length
        ? products.filter((p) => request.categories?.includes(p.category))
        : products

    // Fallback if category filter left us empty.
    if (candidates.length === 0) {
      candidates = products
    }

    const productTexts = candidates.map((p) => this.formatProductForEmbedding(p))
    const inputs = [request.prompt, ...productTexts]

    const embeddings = await this.embeddingProvider.embed(inputs)
    const queryEmbedding = embeddings[0]
    const productEmbeddings = embeddings.slice(1)

    const k = request.limit ?? 5
    const retrieved = retrieveSimilarProducts(queryEmbedding, candidates, productEmbeddings, k * 2)
    const filteredByBudget = request.budget != null ? filterByBudget(retrieved, request.budget) : retrieved

    const pool = filteredByBudget.length ? filteredByBudget : retrieved
    const selectedProducts = pool.slice(0, k).map((r) => r.product)

    const recommendation = await this.llmProvider.generateRecommendation(request.prompt, selectedProducts)
    return recommendation
  }
}
