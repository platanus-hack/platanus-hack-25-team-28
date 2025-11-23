import { Id } from "../_generated/dataModel"
import { query, QueryCtx } from "../_generated/server"
import { StoreName } from "./storeConfig"

export const getStoreIds = query({
  args: {},
  handler: async (ctx: QueryCtx): Promise<Record<StoreName, Id<"stores">>> => {
    const stores = await ctx.db.query("stores").collect()
    const storeMap: Record<string, Id<"stores">> = {}

    for (const store of stores) {
      const storeName = store.name as StoreName
      if (
        storeName === "Lider" ||
        storeName === "Unimarc" ||
        storeName === "Jumbo"
      ) {
        storeMap[storeName] = store._id
      }
    }

    return storeMap
  },
})
