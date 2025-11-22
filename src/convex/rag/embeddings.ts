import { v } from "convex/values"
import { action, internalMutation, internalQuery } from "../_generated/server"
import { api, internal } from "../_generated/api"
import { OpenAIEmbeddingProvider } from "./providers/openaiEmbedding"

export const generateEmbeddings = action({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 2300
    const result = await ctx.runQuery(
      internal.rag.embeddings.getProductsBatch,
      {
        cursor: args.cursor,
        limit,
      }
    )

    const { products, nextCursor, isDone } = result

    if (products.length === 0 && isDone) {
      console.log("Finished generating embeddings (no more products).")
      return
    }

    // Filter for products that actually need embeddings (or process all if desired)
    // The user said "make it so all current products need embeddings", so we could just process all.
    // But to be safe and efficient, we check if it's missing.
    // If the user WANTS to regenerate, they can pass a flag, but for now let's just fill gaps.
    // Actually, to "make it so all... need", I will assume we process any that are missing.
    const productsToEmbed = products.filter((p) => !p.embedding)

    if (productsToEmbed.length > 0) {
      console.log(
        `Generating embeddings for ${productsToEmbed.length} products (batch size: ${products.length})...`
      )
      const apiKey = process.env.OPENAI_API_KEY || ""
      const provider = new OpenAIEmbeddingProvider(apiKey)

      const texts = productsToEmbed.map((p) => {
        return `${p.name} ${p.brand ? `(${p.brand})` : ""}. Categoria: ${p.category}. Tags: ${p.tags.join(", ")}. Descripcion: ${p.description || ""}`
      })

      const embeddings = await provider.embed(texts)

      for (let i = 0; i < productsToEmbed.length; i++) {
        await ctx.runMutation(internal.rag.embeddings.updateProductEmbedding, {
          id: productsToEmbed[i]._id,
          embedding: embeddings[i],
        })
      }
      console.log(`Updated ${productsToEmbed.length} products.`)
    } else {
      console.log(
        `Batch of ${products.length} processed, no embeddings needed.`
      )
    }

    // Recursively call to process more if there is a next cursor
    if (!isDone && nextCursor) {
      await ctx.scheduler.runAfter(0, api.rag.embeddings.generateEmbeddings, {
        cursor: nextCursor,
        limit,
      })
    } else {
      console.log("Embedding generation complete.")
    }
  },
})

export const getProductsBatch = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Use paginate to avoid full table scans.
    // We iterate over ALL products and filter in the action.
    const result = await ctx.db
      .query("products")
      .order("desc") // Order doesn't strictly matter for batching, but consistent order helps
      .paginate({ cursor: args.cursor ?? null, numItems: args.limit })

    return {
      products: result.page,
      isDone: result.isDone,
      nextCursor: result.continueCursor,
    }
  },
})

export const updateProductEmbedding = internalMutation({
  args: {
    id: v.id("products"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { embedding: args.embedding })
  },
})
