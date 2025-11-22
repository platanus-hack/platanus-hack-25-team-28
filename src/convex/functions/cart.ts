import { v } from "convex/values"
import { mutation, query } from "../_generated/server"

export const getCart = query({
  args: {
    sessionId: v.id("conversation_sessions"),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("shopping_carts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first()

    return cart || null
  },
})

export const addToCart = mutation({
  args: {
    sessionId: v.id("conversation_sessions"),
    productId: v.id("products"),
    productName: v.string(),
    brand: v.optional(v.string()),
    category: v.string(),
    quantity: v.number(),
    unit: v.string(),
    pricePerUnit: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("shopping_carts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first()

    const newItem = {
      productId: args.productId,
      productName: args.productName,
      brand: args.brand,
      category: args.category,
      quantity: args.quantity,
      unit: args.unit,
      pricePerUnit: args.pricePerUnit,
      currency: args.currency,
      totalPrice: args.quantity * args.pricePerUnit,
      addedAt: Date.now(),
    }

    if (!cart) {
      const cartId = await ctx.db.insert("shopping_carts", {
        sessionId: args.sessionId,
        items: [newItem],
        totalAmount: newItem.totalPrice,
        currency: args.currency,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      return { cartId, items: [newItem], totalAmount: newItem.totalPrice }
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === args.productId
    )

    const updatedItems = [...cart.items]
    if (existingItemIndex >= 0) {
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + args.quantity,
        totalPrice:
          (updatedItems[existingItemIndex].quantity + args.quantity) * args.pricePerUnit,
      }
    } else {
      updatedItems.push(newItem)
    }

    const actualTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)

    await ctx.db.patch(cart._id, {
      items: updatedItems,
      totalAmount: actualTotal,
      updatedAt: Date.now(),
    })

    return { cartId: cart._id, items: updatedItems, totalAmount: actualTotal }
  },
})

export const removeFromCart = mutation({
  args: {
    sessionId: v.id("conversation_sessions"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("shopping_carts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first()

    if (!cart) throw new Error("Cart not found")

    const updatedItems = cart.items.filter(
      (item) => item.productId !== args.productId
    )

    if (updatedItems.length === 0) {
      await ctx.db.delete(cart._id)
      return { items: [], totalAmount: 0 }
    }

    const newTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)

    await ctx.db.patch(cart._id, {
      items: updatedItems,
      totalAmount: newTotal,
      updatedAt: Date.now(),
    })

    return { items: updatedItems, totalAmount: newTotal }
  },
})

export const updateCartItem = mutation({
  args: {
    sessionId: v.id("conversation_sessions"),
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("shopping_carts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first()

    if (!cart) throw new Error("Cart not found")

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === args.productId
    )

    if (itemIndex < 0) throw new Error("Item not found in cart")

    if (args.quantity <= 0) {
      const updatedItems = cart.items.filter(
        (item) => item.productId !== args.productId
      )

      if (updatedItems.length === 0) {
        await ctx.db.delete(cart._id)
        return { items: [], totalAmount: 0 }
      }

      const newTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
      await ctx.db.patch(cart._id, {
        items: updatedItems,
        totalAmount: newTotal,
        updatedAt: Date.now(),
      })

      return { items: updatedItems, totalAmount: newTotal }
    }

    const updatedItems = [...cart.items]
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: args.quantity,
      totalPrice: args.quantity * updatedItems[itemIndex].pricePerUnit,
    }

    const newTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)

    await ctx.db.patch(cart._id, {
      items: updatedItems,
      totalAmount: newTotal,
      updatedAt: Date.now(),
    })

    return { items: updatedItems, totalAmount: newTotal }
  },
})

export const clearCart = mutation({
  args: {
    sessionId: v.id("conversation_sessions"),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("shopping_carts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first()

    if (cart) {
      await ctx.db.delete(cart._id)
    }

    return { items: [], totalAmount: 0 }
  },
})
