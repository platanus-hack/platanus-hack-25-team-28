import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions"
import { UserIdentity } from "convex/server"
import { ConvexError } from "convex/values"
import { MutationCtx, mutation, query } from "../_generated/server"
import { authedUser } from "../users/helpers"

export const userQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await authedUser(ctx)
    if (!user) throw new ConvexError("Authentication required")
    return { user }
  })
)

export type UserMutationCtx = MutationCtx & { user: UserIdentity }

export const userMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await authedUser(ctx)
    if (!user) throw new ConvexError("Authentication required")
    return { user }
  })
)
