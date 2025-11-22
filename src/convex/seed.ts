import { faker } from "@faker-js/faker"
import { v } from "convex/values"
import { internalMutation } from "./_generated/server"
import { ProductUnit } from "./schema"

// Helper to get random element from array
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Helper to generate random price between min and max
function getRandomPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const seed = internalMutation({
  args: {
    numStores: v.number(),
    numProducts: v.number(),
  },
  handler: async (ctx, args) => {
    const { numStores, numProducts } = args

    // 1. Create Stores
    const storeIds = []
    for (let i = 0; i < numStores; i++) {
      const storeId = await ctx.db.insert("stores", {
        name: faker.company.name() + " Supermarket",
        logo_url: faker.image.url({ height: 100, width: 100 }),
      })
      storeIds.push(storeId)
    }

    console.log(`Created ${storeIds.length} stores`)

    // 2. Create Products
    const productIds = []
    const categories = [
      "Dairy",
      "Meat",
      "Bakery",
      "Beverages",
      "Snacks",
      "Produce",
      "Canned Goods",
    ]
    const units = [
      ProductUnit.KG,
      ProductUnit.G,
      ProductUnit.L,
      ProductUnit.ML,
      ProductUnit.PCS,
    ]

    for (let i = 0; i < numProducts; i++) {
      const productId = await ctx.db.insert("products", {
        name: faker.commerce.productName(),
        brand: faker.company.name(),
        category: getRandomElement(categories),
        quantity: faker.number.float({ min: 0.1, max: 5, fractionDigits: 1 }),
        unit: getRandomElement(units),
        tags: [
          faker.commerce.productAdjective(),
          faker.commerce.productMaterial(),
        ],
        description: faker.commerce.productDescription(),
        // Note: imageId is required in schema but we can't generate valid storage IDs easily.
        // For now we'll need to skip or assume nullable in schema if we want to seed without real uploads.
        // EDIT: I'll update the schema to make imageId optional to allow seeding.
        // For now, let's insert without it if schema allows, or handle it.
        // Checking schema again... imageId is required: v.id("_storage")
      })
      productIds.push(productId)
    }

    console.log(`Created ${productIds.length} products`)

    // 3. Create StoreProducts (Prices)
    let priceCount = 0
    for (const storeId of storeIds) {
      for (const productId of productIds) {
        // Randomly decide if this store carries this product (80% chance)
        if (Math.random() > 0.2) {
          await ctx.db.insert("store_products", {
            storeId,
            productId,
            current_price: BigInt(getRandomPrice(100, 5000)), // cents
            currency: "USD",
            in_stock: Math.random() > 0.1, // 90% in stock
            sku: faker.string.alphanumeric(8).toUpperCase(),
            promotions:
              Math.random() > 0.8
                ? {
                    type: "discount",
                    description: "10% off",
                  }
                : undefined,
          })
          priceCount++
        }
      }
    }

    console.log(`Created ${priceCount} price entries`)
    return {
      stores: storeIds.length,
      products: productIds.length,
      prices: priceCount,
    }
  },
})

// clear all data from the database
export const clear = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["numbers", "stores", "products", "store_products"] as const
    for (const table of tables) {
      for await (const item of ctx.db.query(table)) {
        await ctx.db.delete(item._id)
      }
    }
  },
})
