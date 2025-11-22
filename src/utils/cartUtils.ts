import { LiderProduct, CartItem } from "@/types"
import rawProducts from "@/data/lider_products.json"

// Transform raw data to LiderProduct type
interface RawProduct {
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
  category: string;
}

const allProducts: LiderProduct[] = (rawProducts as RawProduct[]).map((p) => ({
  name: p.name,
  sku: p.sku,
  url: `https://www.lider.cl/supermercado/product/${p.sku}`, // Mock URL
  price: p.price,
  imageUrl: p.imageUrl,
  category: p.category,
  store: "Lider",
  date: new Date().toISOString(),
}))

export const getProducts = () => allProducts

/**
 * Builds a mock cart by randomly selecting products from the available products.
 * In a real implementation, this would be replaced with AI logic.
 */
export function buildMockCart(): CartItem[] {
  // Randomly select 12-18 products as requested
  const count = Math.floor(Math.random() * 7) + 12 // 12 to 18
  const shuffled = [...allProducts].sort(() => 0.5 - Math.random())

  return shuffled.slice(0, count).map((product) => ({
    ...product,
    quantity: 1, // Default quantity
  }))
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
