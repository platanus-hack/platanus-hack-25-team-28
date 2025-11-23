export type StoreName = "Lider" | "Unimarc" | "Jumbo"

export const STORE_CATEGORIES: Record<StoreName, string[]> = {
  Jumbo: [
    "carnes-y-pescados",
    "frutas-y-verduras",
    "lacteos-huevos-y-congelados",
    "quesos-y-fiambres",
    "despensa",
    "panaderia-y-pasteleria",
    "licores-bebidas-y-aguas",
    "chocolates-galletas-y-snacks",
  ],
  Unimarc: [
    "bebidas-y-licores",
    "carnes",
    "congelados",
    "desayuno-y-dulces",
    "despensa",
    "frutas-y-verduras",
    "lacteos-huevos-y-refrigerados",
    "panaderia-y-pasteleria",
    "quesos-y-fiambres",
  ],
  Lider: [
    "bebidas",
    "cerdo",
    "congelados",
    "despensa",
    "frutas y verduras",
    "lacteos",
    "licores",
    "limpieza",
    "panaderia",
    "pescados y mariscos",
    "pollo",
    "quesos y fiambres",
    "vacuno",
  ],
}

export function getStoreCategories(storeName: StoreName): string[] {
  return STORE_CATEGORIES[storeName] || []
}

export function mapCategoryToStore(
  userCategory: string,
  storeName: StoreName
): string | null {
  const storeCategories = getStoreCategories(storeName)
  const normalizedUser = userCategory.toLowerCase().trim()

  // Try exact match first
  if (storeCategories.includes(normalizedUser)) {
    return normalizedUser
  }

  // Try to find closest match (simple substring matching)
  for (const storeCat of storeCategories) {
    const normalizedStore = storeCat.toLowerCase()
    if (
      normalizedUser.includes(normalizedStore) ||
      normalizedStore.includes(normalizedUser)
    ) {
      return storeCat
    }
  }

  return null
}

