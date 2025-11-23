/**
 * Checks if a URL is a valid Lider URL
 */
export function isLiderUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === "www.lider.cl" || urlObj.hostname === "lider.cl"
  } catch {
    return false
  }
}

/**
 * Extracts the product ID from a Lider product URL
 * Supports various Lider URL formats:
 * - https://www.lider.cl/supermercado/product/{productId}
 * - https://www.lider.cl/producto/{productId}
 * - https://www.lider.cl/supermercado/product/{productId}?...
 */
export function extractProductIdFromUrl(url: string): string | null {
  if (!isLiderUrl(url)) {
    return null
  }

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Pattern: /supermercado/product/{productId}
    const supermercadoMatch = pathname.match(
      /\/supermercado\/product\/([^/?#]+)/
    )
    if (supermercadoMatch?.[1]) {
      return supermercadoMatch[1]
    }

    // Pattern: /producto/{productId}
    const productoMatch = pathname.match(/\/producto\/([^/?#]+)/)
    if (productoMatch?.[1]) {
      return productoMatch[1]
    }

    // Pattern: /product/{productId}
    const productMatch = pathname.match(/\/product\/([^/?#]+)/)
    if (productMatch?.[1]) {
      return productMatch[1]
    }

    // Try to extract from query parameters as fallback
    const productIdParam = urlObj.searchParams.get("productId")
    if (productIdParam) {
      return productIdParam
    }

    return null
  } catch {
    return null
  }
}
