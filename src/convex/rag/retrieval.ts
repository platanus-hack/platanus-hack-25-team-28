import { EnrichedProduct, SimilarityResult } from "./types"

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return normA && normB ? dot / (normA * normB) : 0
}

export function retrieveSimilarProducts(
  queryEmbedding: number[],
  products: EnrichedProduct[],
  productEmbeddings: number[][],
  k: number = 10
): SimilarityResult[] {
  const scores = productEmbeddings.map((embedding, index) => ({
    index,
    score: cosineSimilarity(queryEmbedding, embedding),
    product: products[index],
  }))

  return scores.sort((a, b) => b.score - a.score).slice(0, k)
}

export function filterByBudget(
  results: SimilarityResult[],
  budget: number,
  avgQuantity: number = 1
): SimilarityResult[] {
  return results.filter((r) => {
    const price = r.product.minPrice || 0
    return price * avgQuantity <= budget
  })
}
