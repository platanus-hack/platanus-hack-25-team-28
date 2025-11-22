import { v } from "convex/values"
import { action } from "./_generated/server"

const JUMBO_CART_API =
  "https://be-reg-groceries-bff-jumbo.ecomm.cencosud.com/cart/items"
const JUMBO_STORE_ID = "jumboclj512"

function generateGuestId(): string {
  const uuid = crypto.randomUUID()
  return `guest:${uuid}`
}

export const getJumboCart = action({
  args: {
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey =
      process.env.JUMBO_API_KEY || "be-reg-groceries-jumbo-cart-rhk68rqi0adn"

    const cartUrl = `https://be-reg-groceries-bff-jumbo.ecomm.cencosud.com/cart?store=${JUMBO_STORE_ID}&simulationTotals=true`

    const response = await fetch(cartUrl, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        apikey: apiKey,
        "x-provider-guest-id": args.guestId,
        "x-client-platform": "web",
        "x-client-version": "3.1.26",
        origin: "https://www.jumbo.cl",
        referer: "https://www.jumbo.cl/",
      },
    })

    if (response.status === 404) {
      return {
        success: true,
        cartId: null,
        items: [],
        totals: null,
        guestId: args.guestId,
        isEmpty: true,
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to get Jumbo cart: ${response.status} - ${errorText}`
      )
    }

    const result = await response.json()

    return {
      success: true,
      cartId: result.id,
      items: result.items || [],
      totals: result.totals,
      guestId: args.guestId,
      isEmpty: (result.items || []).length === 0,
    }
  },
})

export const addToJumboCart = action({
  args: {
    items: v.array(
      v.object({
        skuId: v.string(),
        quantity: v.number(),
        isUnitary: v.optional(v.boolean()),
        giftable: v.optional(v.boolean()),
        itemQuantityLimit: v.optional(v.number()),
        measurementUnitUn: v.optional(v.string()),
        unitMultiplierUn: v.optional(v.number()),
        isUnitaryEligible: v.optional(v.boolean()),
        sponsoredId: v.optional(v.union(v.string(), v.null())),
      })
    ),
    guestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey =
      process.env.JUMBO_API_KEY || "be-reg-groceries-jumbo-cart-rhk68rqi0adn"
    const guestId = args.guestId || generateGuestId()

    const itemsPayload = args.items.map((item) => ({
      skuId: item.skuId,
      quantity: item.quantity,
      store: JUMBO_STORE_ID,
      isUnitary: item.isUnitary ?? false,
      giftable: item.giftable ?? false,
      isUnitaryEligible: item.isUnitaryEligible ?? false,
      itemQuantityLimit: item.itemQuantityLimit,
      measurementUnitUn: item.measurementUnitUn,
      unitMultiplierUn: item.unitMultiplierUn,
      sponsoredId: item.sponsoredId ?? null,
    }))

    const response = await fetch(JUMBO_CART_API, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json, text/plain, */*",
        apikey: apiKey,
        "x-provider-guest-id": guestId,
        "x-client-platform": "web",
        "x-client-version": "3.1.26",
        origin: "https://www.jumbo.cl",
        referer: "https://www.jumbo.cl/",
      },
      body: JSON.stringify({ items: itemsPayload, store: JUMBO_STORE_ID }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to add items to Jumbo cart: ${response.status} - ${errorText}`
      )
    }

    const result = await response.json()

    return {
      success: true,
      directJumboUrl: `https://www.jumbo.cl/`,
      guestId,
      cartId: result.id,
      addedItems: result.items || itemsPayload,
      totals: result.totals,
    }
  },
})
