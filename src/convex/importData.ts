import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction, internalMutation } from "./_generated/server"
import { ProductUnit } from "./schema"

// --- Components ---

// 1. Public Action to Start the Process
// This is the entry point. It takes the big JSON blob, splits it, and schedules the work.

export const deleteAllProducts = internalMutation({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect()
    for (const product of products) await ctx.db.delete(product._id)
  },
})

export const importData = internalAction({
  args: {
    storeName: v.string(),
    products: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const { storeName, products } = args
    const BATCH_SIZE = 20 // Process 20 products per transaction to be safe

    // 1. Ensure Store Exists (Run this once)
    const storeId = await ctx.runMutation(internal.importData.ensureStore, {
      name: storeName,
    })

    // 2. Chunk the products
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE)

      // 3. Schedule the batch processing
      // We use scheduler to run these in the background, preventing timeout of this action
      await ctx.scheduler.runAfter(0, internal.importData.processBatch, {
        storeId,
        products: batch,
      })
    }

    return {
      success: true,
      message: `Scheduled ${products.length} items for import`,
    }
  },
})

// 2. Mutation to Ensure Store Exists
export const ensureStore = internalMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first()

    if (existing) return existing._id

    return await ctx.db.insert("stores", {
      name: args.name,
      logo_url: "https://via.placeholder.com/100",
      // slug: args.name.toLowerCase().replace(/\s+/g, "-"), // Removed as per schema
    })
  },
})

// 3. Mutation to Process a Batch
export const processBatch = internalMutation({
  args: {
    storeId: v.id("stores"),
    products: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const { storeId, products } = args

    for (const item of products) {
      await processSingleItem(ctx, storeId, item)
    }
  },
})

// --- Helper Logic ---

async function processSingleItem(ctx: any, storeId: any, item: any) {
  // Parse Unit and Quantity
  let quantity = 1
  let unit = ProductUnit.PCS

  const weightMatch = item.name.match(/(\d+)\s*(g|kg|ml|l)/i)
  if (weightMatch) {
    quantity = parseFloat(weightMatch[1])
    const rawUnit = weightMatch[2].toLowerCase()
    if (rawUnit === "g") unit = ProductUnit.G
    if (rawUnit === "kg") unit = ProductUnit.KG
    if (rawUnit === "ml") unit = ProductUnit.ML
    if (rawUnit === "l") unit = ProductUnit.L
  }

  // Upsert Product
  let productId = await ctx.db
    .query("products")
    .withIndex("by_name_brand", (q: any) =>
      q.eq("name", item.name).eq("brand", item.brand ?? undefined)
    )
    .first()
    .then((p: any) => p?._id)

  if (!productId) {
    productId = await ctx.db.insert("products", {
      name: item.name,
      brand: item.brand,
      category: item.category,
      quantity,
      unit,
      tags: [item.category],
      description: item.description ?? undefined,
      imageUrl: item.image_url,
    })
  }

  // Upsert Price
  const existingPrice = await ctx.db
    .query("store_products")
    .withIndex("by_store_and_product", (q: any) =>
      q.eq("storeId", storeId).eq("productId", productId)
    )
    .first()

  if (existingPrice) {
    await ctx.db.patch(existingPrice._id, {
      current_price: BigInt(item.price),
      in_stock: item.in_stock,
      sku: item.sku,
      promotions: item.promo_text
        ? { type: "text", description: item.promo_text }
        : undefined,
    })
  } else {
    await ctx.db.insert("store_products", {
      storeId: storeId,
      productId: productId,
      current_price: BigInt(item.price),
      currency: item.currency,
      in_stock: item.in_stock,
      sku: item.sku,
      promotions: item.promo_text
        ? { type: "text", description: item.promo_text }
        : undefined,
    })
  }
}
