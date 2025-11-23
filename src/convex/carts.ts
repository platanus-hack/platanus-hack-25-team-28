import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authedUser } from "./users/helpers"

export const createCart = mutation({
  args: {
    storeName: v.string(),
    items: v.array(
      v.object({
        name: v.string(),
        sku: v.string(),
        url: v.string(),
        price: v.number(),
        imageUrl: v.string(),
        category: v.string(),
        store: v.string(),
        date: v.string(),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject

    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("name"), args.storeName))
      .first()

    let storeId
    if (!store) {
      storeId = await ctx.db.insert("stores", {
        name: args.storeName,
        logo_url: undefined,
      })
    } else {
      storeId = store._id
    }

    const now = Date.now()
    const cartId = await ctx.db.insert("carts", {
      userId: userId,
      storeId,
      status: "pending",
      createdAt: now,
    })

    for (const item of args.items) {
      await ctx.db.insert("cart_items", {
        cartId,
        externalSku: item.sku,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        imageUrl: item.imageUrl,
        category: item.category,
      })
    }

    return { cartId }
  },
})

export const getCartById = query({
  args: {
    cartId: v.id("carts"),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.cartId)
    if (!cart) {
      return null
    }

    const identity = await ctx.auth.getUserIdentity()
    if (cart.userId) {
      if (!identity || cart.userId !== identity.subject) {
        return null
      }
    }

    const store = await ctx.db.get(cart.storeId)
    if (!store) {
      return null
    }

    const items = await ctx.db
      .query("cart_items")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .collect()

    return {
      _id: cart._id,
      userId: cart.userId,
      storeId: cart.storeId,
      storeName: store.name,
      status: cart.status,
      createdAt: cart.createdAt,
      completedAt: cart.completedAt,
      items: items.map((item) => ({
        _id: item._id,
        productId: item.productId,
        externalSku: item.externalSku,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        imageUrl: item.imageUrl,
        category: item.category,
      })),
    }
  },
})

export const completeCart = mutation({
  args: {
    cartId: v.id("carts"),
  },
  handler: async (ctx, args) => {
    const { user } = await authedUser(ctx)

    const cart = await ctx.db.get(args.cartId)
    if (!cart) {
      throw new ConvexError("Cart not found")
    }

    if (cart.userId !== user.subject) {
      throw new ConvexError("Unauthorized")
    }

    await ctx.db.patch(args.cartId, {
      status: "completed",
      completedAt: Date.now(),
    })

    return { success: true }
  },
})
