import { v } from "convex/values"
import { query } from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").take(20)

    // Fetch best price for each product
    const productsWithPrice = await Promise.all(
      products.map(async (product) => {
        const bestPriceDoc = await ctx.db
          .query("store_products")
          .withIndex("by_product_price", (q) => q.eq("productId", product._id))
          .order("asc")
          .first()

        return {
          ...product,
          bestPrice: bestPriceDoc ? bestPriceDoc.current_price : undefined,
        }
      })
    )

    return productsWithPrice
  },
})
