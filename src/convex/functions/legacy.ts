import { v } from "convex/values"
import { api } from "../_generated/api"
import { action, mutation, query } from "../_generated/server"

export const listNumbers = query({
  args: {
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const numbers = await ctx.db.query("numbers").order("desc").take(args.count)
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    }
  },
})

export const addNumber = mutation({
  args: {
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("numbers", { value: args.value })
    console.log("Added new document with id:", id)
  },
})

export const myAction = action({
  args: {
    first: v.number(),
    second: v.string(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(api.functions.legacy.listNumbers, {
      count: 10,
    })
    console.log(data)

    await ctx.runMutation(api.functions.legacy.addNumber, {
      value: args.first,
    })
  },
})
