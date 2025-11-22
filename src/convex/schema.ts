import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export enum ProductUnit {
  KG = "kg",
  G = "g",
  L = "L",
  ML = "ml",
  PCS = "pcs",
}

export const ProductUnitValidatior = v.union(
  v.literal(ProductUnit.KG),
  v.literal(ProductUnit.G),
  v.literal(ProductUnit.L),
  v.literal(ProductUnit.ML),
  v.literal(ProductUnit.PCS)
)

export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  // 1. Stores: Physical or logical supermarkets
  stores: defineTable({
    name: v.string(),
    logo_url: v.optional(v.string()),
  }),

  // 2. Products: The conceptual items (e.g. "Coca Cola 1.5L")
  // Independent of any specific store.
  products: defineTable({
    name: v.string(),
    brand: v.optional(v.string()),
    category: v.string(), // e.g. "Beverages"
    quantity: v.number(), // e.g. 1.5, 500
    unit: ProductUnitValidatior, // e.g. "kg", "g", "L", "ml", "pcs"
    tags: v.array(v.string()), // e.g. ["sugar-free", "soda"]
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
  })
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "brand"],
    })
    .index("by_name_brand", ["name", "brand"]),

  // 3. StoreProducts: The critical junction table (Price & Inventory)
  // Maps a Product to a Store with a specific price.
  store_products: defineTable({
    storeId: v.id("stores"),
    productId: v.id("products"),

    // Price & Currency
    current_price: v.int64(), // Store as decimal or integer (cents) depending on preference. using float for simplicity here.
    currency: v.string(), // "USD", "EUR"

    // Availability
    in_stock: v.boolean(),

    // Metadata
    sku: v.optional(v.string()), // Store-specific ID
    promotions: v.optional(
      v.object({
        type: v.string(), // "3x2", "discount"
        description: v.string(),
      })
    ),
  })
    // INDEX 1: Uniqueness & Lookup
    // Used to ensure one price entry per product per store.
    // Also used to fetch a specific product's price in a specific store.
    .index("by_store_and_product", ["storeId", "productId"])

    // INDEX 2: Price Comparison (Per Product)
    // Critical for Strategy 2 "Cheapest per product".
    // Allows efficient `q.eq("product_id", id).order("asc")` to find the cheapest store.
    .index("by_product_price", ["productId", "current_price"])

    // INDEX 3: Catalog browsing
    // Used if we want to list all products available in a specific store.
    .index("by_store", ["storeId"]),

  // 4. PriceHistory: Analytical data (Optional but recommended)
  price_histories: defineTable({
    storeProductId: v.id("store_products"),
    price: v.number(),
    currency: v.string(),
    valid_from: v.number(), // Timestamp
    valid_to: v.optional(v.number()), // Timestamp, null if current
  }).index("by_store_product", ["storeProductId", "valid_from"]),
})
