import { v } from "convex/values"
import { api, internal } from "../_generated/api"
import { action, internalMutation, internalQuery } from "../_generated/server"
import { OpenAIEmbeddingProvider } from "./providers/openaiEmbedding"

export const generateEmbeddings = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 500
    const { products } = await ctx.runQuery(
      internal.rag.embeddings.getProductsBatch,
      { limit }
    )

    // Filter out products that already have embeddings, just in case
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsToEmbed = products.filter((p: any) => !p.embedding)

    if (productsToEmbed.length === 0) {
      console.log(
        "Embedding generation complete (no more products without embeddings)."
      )
      return
    }

    console.log(
      `Generating embeddings for ${productsToEmbed.length} products...`
    )

    const apiKey = process.env.OPENAI_API_KEY || ""
    const provider = new OpenAIEmbeddingProvider(apiKey)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const texts = productsToEmbed.map((p: any) => {
      return `${p.name} ${p.brand ? `(${p.brand})` : ""}. Categoria: ${p.category}. Tags: ${p.tags.join(", ")}. Descripcion: ${p.description || ""}`
    })

    try {
      const embeddings = await provider.embed(texts)

      await ctx.runMutation(
        internal.rag.embeddings.updateProductEmbeddingsBatch,
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          updates: productsToEmbed.map((p: any, i: number) => ({
            id: p._id,
            embedding: embeddings[i],
          })),
        }
      )

      console.log(`Updated ${productsToEmbed.length} products.`)

      // Recursively schedule the next batch
      await ctx.scheduler.runAfter(0, api.rag.embeddings.generateEmbeddings, {
        limit,
      })
    } catch (error) {
      console.error("Error generating embeddings:", error)
      // Optional: Schedule retry or stop?
      // For now, we stop to avoid infinite error loops, or we could retry.
      // Let's stop and log.
    }
  },
})

export const getProductsBatch = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.eq(q.field("embedding"), undefined))
      .take(args.limit)

    return { products }
  },
})

export const updateProductEmbeddingsBatch = internalMutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("products"),
        embedding: v.array(v.float64()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.id, { embedding: update.embedding })
    }
  },
})
