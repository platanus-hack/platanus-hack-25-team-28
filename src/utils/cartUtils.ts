import { LiderProduct } from "@/types";

/**
 * Builds a mock cart by randomly selecting products from the available products.
 * In a real implementation, this would be replaced with AI logic.
 */
export function buildMockCart(products: LiderProduct[]): LiderProduct[] {
  // Randomly select 5-10 products
  const count = Math.floor(Math.random() * 6) + 5;
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

