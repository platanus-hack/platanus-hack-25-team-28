import { v } from "convex/values"
import { query } from "../_generated/server"
import { Product } from "../rag/types"

export const listProducts = query({
  args: {
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect()

    const enrichedProducts: Product[] = await Promise.all(
      products.map(async (p) => {
        let storeProducts = await ctx.db
          .query("store_products")
          .withIndex("by_product_price", (q) => q.eq("productId", p._id))
          .collect()

        if (args.storeId) {
          storeProducts = storeProducts.filter((sp) => sp.storeId === args.storeId)
        }

        const prices = await Promise.all(
          storeProducts.map(async (sp) => {
            const store = await ctx.db.get(sp.storeId)
            return {
              storeId: sp.storeId,
              storeName: store?.name || "Unknown Store",
              currentPrice: Number(sp.current_price) / 100,
              currency: sp.currency,
              inStock: sp.in_stock,
              sku: sp.sku,
              promotions: sp.promotions,
            }
          })
        )

        const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.currentPrice)) : undefined
        const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.currentPrice)) : undefined

        return {
          _id: p._id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          quantity: p.quantity,
          unit: p.unit,
          tags: p.tags || [],
          description: p.description,
          imageId: p.imageId,
          prices,
          minPrice,
          maxPrice,
        }
      })
    )

    return enrichedProducts
  },
})

export const getProductsByIds = query({
  args: {
    productIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    const products = await Promise.all(
      args.productIds.map(async (id) => {
        const product = await ctx.db.get(id)
        if (!product || product._creationTime === undefined) return null

        const storeProducts = await ctx.db
          .query("store_products")
          .withIndex("by_product_price", (q) => q.eq("productId", id))
          .collect()

        const prices = await Promise.all(
          storeProducts.map(async (sp) => {
            const store = await ctx.db.get(sp.storeId)
            return {
              storeId: sp.storeId,
              storeName: store?.name || "Unknown Store",
              currentPrice: Number(sp.current_price) / 100,
              currency: sp.currency,
              inStock: sp.in_stock,
              sku: sp.sku,
              promotions: sp.promotions,
            }
          })
        )

        const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.currentPrice)) : undefined
        const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.currentPrice)) : undefined

        return {
          _id: product._id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          quantity: product.quantity,
          unit: product.unit,
          tags: product.tags || [],
          description: product.description,
          imageId: product.imageId,
          prices,
          minPrice,
          maxPrice,
        }
      })
    )

    return products.filter((p) => p !== null)
  },
})
