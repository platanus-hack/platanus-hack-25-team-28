import { v } from "convex/values"
import { action } from "./_generated/server"

const OPEN_BROWSER_API = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/jumbo/open-browser`
  : "http://localhost:3000/api/jumbo/open-browser"

type AddToCartResult = {
  success: boolean
  url: string
  beforeCount: number
  afterCount: number
  addToCartResponseStatus: number | null
  addToCartResponseUrl: string | null
  error?: string
  ms: number
}

export const addMultipleProductsToCart = action({
  args: {
    productUrls: v.array(v.string()),
    headless: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
    delayBetweenBatches: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      productUrls,
      headless = true,
      batchSize = 2,
      delayBetweenBatches = 2000,
    } = args

    const startTime = Date.now()
    const results: Array<{
      url: string
      success: boolean
      data: AddToCartResult | null
      error: string | null
    }> = []

    for (let i = 0; i < productUrls.length; i += batchSize) {
      const batch = productUrls.slice(i, i + batchSize)

      const batchResults = await Promise.allSettled(
        batch.map(async (productUrl) => {
          const response = await fetch(OPEN_BROWSER_API, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productUrl,
              headless,
              keepOpen: false,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(
              `Failed to add product: ${response.status} - ${errorText}`
            )
          }

          return (await response.json()) as AddToCartResult
        })
      )

      results.push(
        ...batchResults.map((r, idx) => ({
          url: batch[idx],
          success: r.status === "fulfilled",
          data: r.status === "fulfilled" ? r.value : null,
          error: r.status === "rejected" ? r.reason.message : null,
        }))
      )

      if (i + batchSize < productUrls.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches))
      }
    }

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    const totalMs = Date.now() - startTime

    return {
      success: failed === 0,
      totalProducts: productUrls.length,
      succeeded,
      failed,
      results,
      totalMs,
    }
  },
})

export const openJumboCart = action({
  args: {},
  handler: async (ctx, args) => {
    const cartUrl = "https://www.jumbo.cl"

    const response = await fetch(OPEN_BROWSER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productUrl: cartUrl,
        headless: false,
        keepOpen: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to open cart: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    return {
      success: true,
      cartUrl,
      ...result,
    }
  },
})

export const addProductsAndOpenCart = action({
  args: {
    productUrls: v.array(v.string()),
    headless: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
    delayBetweenBatches: v.optional(v.number()),
    delayBeforeOpeningCart: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      productUrls,
      headless = true,
      batchSize = 2,
      delayBetweenBatches = 2000,
      delayBeforeOpeningCart = 3000,
    } = args

    const startTime = Date.now()
    const results: Array<{
      url: string
      success: boolean
      data: AddToCartResult | null
      error: string | null
    }> = []

    for (let i = 0; i < productUrls.length; i += batchSize) {
      const batch = productUrls.slice(i, i + batchSize)

      const batchResults = await Promise.allSettled(
        batch.map(async (productUrl) => {
          const response = await fetch(OPEN_BROWSER_API, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productUrl,
              headless,
              keepOpen: false,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(
              `Failed to add product: ${response.status} - ${errorText}`
            )
          }

          return (await response.json()) as AddToCartResult
        })
      )

      results.push(
        ...batchResults.map((r, idx) => ({
          url: batch[idx],
          success: r.status === "fulfilled",
          data: r.status === "fulfilled" ? r.value : null,
          error: r.status === "rejected" ? r.reason.message : null,
        }))
      )

      if (i + batchSize < productUrls.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches))
      }
    }

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length
    const totalMs = Date.now() - startTime

    if (succeeded > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, delayBeforeOpeningCart)
      )

      const cartUrl = "https://www.jumbo.cl"
      const cartResponse = await fetch(OPEN_BROWSER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productUrl: cartUrl,
          headless: false,
          keepOpen: true,
        }),
      })

      const cartResult = cartResponse.ok ? await cartResponse.json() : null

      return {
        success: failed === 0,
        totalProducts: productUrls.length,
        succeeded,
        failed,
        results,
        totalMs,
        cartOpened: true,
        cartUrl,
        cartResult,
      }
    }

    return {
      success: failed === 0,
      totalProducts: productUrls.length,
      succeeded,
      failed,
      results,
      totalMs,
      cartOpened: false,
      message: "No products were added successfully, cart not opened",
    }
  },
})
