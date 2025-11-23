import { userQuery } from "../_lib/authFunctions"

export const currentUser = userQuery({
  handler: async (ctx) => ctx.user,
})
