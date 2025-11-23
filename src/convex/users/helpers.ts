import { ConvexError } from "convex/values"
import { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server"

export async function authedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError("User not authenticated")

  return { user: identity }
}

export async function authedUserInAction(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError("User not authenticated")

  return { user: identity }
}
