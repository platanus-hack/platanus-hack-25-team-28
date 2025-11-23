import { extractProductIdFromUrl, isLiderUrl } from "@/utils/liderUtils"
import { NextRequest, NextResponse } from "next/server"

type Body = {
  productUrl?: string
  productId?: string
  sku?: string
  quantity?: number
  cartId?: string
  cookies?: string
  cookieJar?: CookieJar
  offerId?: string
  productName?: string
}

const LIDER_GRAPHQL_ENDPOINT = "https://www.lider.cl/orchestra/graphql"
const LIDER_BASE_URL = "https://www.lider.cl"

interface CookieJar {
  cookies: string
  cartId?: string
}

function parseSetCookieHeaders(setCookieHeaders: string[]): string {
  const cookieMap = new Map<string, string>()

  for (const header of setCookieHeaders) {
    const parts = header.split(";")
    const [nameValue] = parts
    const [name, value] = nameValue.split("=")
    if (name && value) {
      cookieMap.set(name.trim(), value.trim())
    }
  }

  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ")
}

function mergeCookies(existing: string, newCookies: string): string {
  const existingMap = new Map<string, string>()
  const newMap = new Map<string, string>()

  existing.split(";").forEach((cookie) => {
    const [name, value] = cookie.split("=").map((s) => s.trim())
    if (name && value) existingMap.set(name, value)
  })

  newCookies.split(";").forEach((cookie) => {
    const [name, value] = cookie.split("=").map((s) => s.trim())
    if (name && value) newMap.set(name, value)
  })

  const merged = new Map([...existingMap, ...newMap])
  return Array.from(merged.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ")
}

async function initializeSession(): Promise<CookieJar> {
  try {
    const response = await fetch(LIDER_BASE_URL, {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-CL,es;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      },
    })

    const setCookieHeaders: string[] = []
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        setCookieHeaders.push(value)
      }
    })

    const cookies = parseSetCookieHeaders(setCookieHeaders)

    return { cookies }
  } catch (error) {
    console.error("Failed to initialize session:", error)
    return { cookies: "" }
  }
}

async function initializeCart(cookieJar: CookieJar): Promise<CookieJar> {
  // If we already have a cartId, return early
  if (cookieJar.cartId) {
    return cookieJar
  }

  // MergeAndGetCart mutation to initialize/create the cart
  // Using minimal query - only requesting essential fields
  const mutation = `mutation MergeAndGetCart($input: MergeAndGetCartInput!) {
    mergeAndGetCart(input: $input) {
      id
      checkoutable
      lineItems {
        id
        quantity
      }
    }
  }`

  const variables = {
    input: {
      cartId: null, // Let the server create a new cart
      strategy: "MERGE",
      enableLiquorBox: false,
      enableCartSplitClarity: false,
      features: ["lmpdel"],
    },
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "es-CL,es;q=0.9",
    Origin: "https://www.lider.cl",
    Referer: "https://www.lider.cl/",
    "x-apollo-operation-name": "MergeAndGetCart",
    "x-o-bu": "LIDER-CL",
    "x-o-ccm": "server",
    "x-o-correlation-id": `bp${Math.random().toString(36).substring(2, 15)}`,
    "x-o-gql-query": "mutation MergeAndGetCart",
    "x-o-mart": "B2C",
    "x-o-platform": "rweb",
    "x-o-platform-version": "main-1.164.0-97e338f-1117T1104",
    "x-o-segment": "oaoh",
    "x-o-vertical": "EA",
    "x-enable-server-timing": "1",
    "x-latency-trace": "1",
    device_profile_ref_id: "4lybqbq3ewor_zzmw4vfw_2h2ha7zl83aonw",
    wm_mp: "true",
    wm_page_url: "https://www.lider.cl/",
    "sec-ch-ua":
      '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  }

  if (cookieJar.cookies) {
    headers.Cookie = cookieJar.cookies
  }

  try {
    const response = await fetch(LIDER_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    })

    const setCookieHeaders: string[] = []
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        setCookieHeaders.push(value)
      }
    })

    let updatedCookies = cookieJar.cookies
    if (setCookieHeaders.length > 0) {
      const newCookies = parseSetCookieHeaders(setCookieHeaders)
      updatedCookies = cookieJar.cookies
        ? mergeCookies(cookieJar.cookies, newCookies)
        : newCookies
    }

    const data = await response.json()

    // Try to extract cartId from response first
    const cartId = data?.data?.mergeAndGetCart?.id || null

    // Extract cartId from cookies if not in response (even if there are errors)
    let finalCartId = cartId
    if (!finalCartId && updatedCookies) {
      const cartIdMatch = updatedCookies.match(/cartId=([^;]+)/)
      if (cartIdMatch) {
        finalCartId = cartIdMatch[1]
      }
    }

    if (!response.ok || data.errors) {
      console.error("Failed to initialize cart:", {
        status: response.status,
        statusText: response.statusText,
        errors: data.errors,
        data: data.data,
        cartIdFromResponse: cartId,
        cartIdFromCookies: finalCartId,
        requestBody: JSON.stringify({ query: mutation, variables }, null, 2),
      })
      // Still return cookies and cartId if we found it, even if there were errors
      return { cookies: updatedCookies, cartId: finalCartId || undefined }
    }

    return {
      cookies: updatedCookies,
      cartId: finalCartId || undefined,
    }
  } catch (error) {
    console.error("Failed to initialize cart:", error)
    return { cookies: cookieJar.cookies, cartId: undefined }
  }
}

async function fetchProductDetails(
  productUrl: string,
  cookies: string
): Promise<{ offerId?: string; usItemId?: string; name?: string }> {
  try {
    const response = await fetch(productUrl, {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-CL,es;q=0.9",
        Cookie: cookies,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      },
    })

    const html = await response.text()

    // Try multiple patterns for offerId
    const offerIdPatterns = [
      /"offerId"\s*:\s*"([^"]+)"/,
      /"offerId"\s*:\s*'([^']+)'/,
      /offerId["']?\s*[:=]\s*["']([^"']+)["']/,
      /"offerId"\s*:\s*(\d+)/,
    ]

    let offerId: string | undefined
    for (const pattern of offerIdPatterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        offerId = match[1]
        break
      }
    }

    // Try multiple patterns for usItemId
    const usItemIdPatterns = [
      /"usItemId"\s*:\s*"([^"]+)"/,
      /"usItemId"\s*:\s*'([^']+)'/,
      /usItemId["']?\s*[:=]\s*["']([^"']+)["']/,
      /"usItemId"\s*:\s*(\d+)/,
    ]

    let usItemId: string | undefined
    for (const pattern of usItemIdPatterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        usItemId = match[1]
        break
      }
    }

    // Try multiple patterns for name
    const namePatterns = [
      /"name"\s*:\s*"([^"]+)"/,
      /"name"\s*:\s*'([^']+)'/,
      /"productName"\s*:\s*"([^"]+)"/,
    ]

    let name: string | undefined
    for (const pattern of namePatterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        name = match[1]?.replace(/\\"/g, '"').replace(/\\'/g, "'")
        break
      }
    }

    return {
      offerId,
      usItemId,
      name,
    }
  } catch (error) {
    console.error("Failed to fetch product details:", error)
    return {}
  }
}

async function addItemToCart(
  productId: string,
  quantity: number = 1,
  cookieJar?: CookieJar,
  offerId?: string,
  productName?: string
): Promise<{
  success: boolean
  cartId: string | null
  lineItems: unknown[]
  error?: string
  response?: unknown
  cookieJar?: CookieJar
}> {
  if (!offerId) {
    return {
      success: false,
      cartId: cookieJar?.cartId || null,
      lineItems: [],
      error: "offerId is required to add items to cart",
      cookieJar: cookieJar,
    }
  }

  // Using a simplified query that only requests essential fields
  // The full query with all fragments is too complex and has missing fragment definitions
  // This simplified version should work for basic cart operations
  const mutation = `mutation updateItems($input: UpdateItemsInput!) {
    updateItems(input: $input) {
      id
      checkoutable
      lineItems {
        id
        quantity
        quantityString
        product {
          id
          usItemId
          offerId
          name
        }
        priceInfo {
          itemPrice {
            displayValue
            value
          }
          linePrice {
            displayValue
            value
          }
        }
      }
      priceDetails {
        subTotal {
          value
          displayValue
        }
      }
      operationalErrors {
        offerId
        itemId
        requestedQuantity
        adjustedQuantity
        code
        upstreamErrorCode
      }
    }
  }`

  const variables = {
    input: {
      enableLiquorBox: false,
      cartId: cookieJar?.cartId || null, // Always include cartId, even if null
      items: [
        {
          offerId: offerId,
          usItemId: productId,
          quantity: quantity,
          salesUnit: "EACH",
          additionalInfo: {},
          ...(productName && { name: productName }),
        },
      ],
      isGiftOrder: null,
      cartLeanMode: false,
      enableCartSplitClarity: false,
      features: ["lmpdel"],
    },
  }

  const currentCookies = cookieJar?.cookies || ""
  const currentCartId = cookieJar?.cartId

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "es-CL,es;q=0.9",
    Origin: "https://www.lider.cl",
    Referer: "https://www.lider.cl/",
    "x-apollo-operation-name": "updateItems",
    "x-o-bu": "LIDER-CL",
    "x-o-ccm": "server",
    "x-o-correlation-id": `bp${Math.random().toString(36).substring(2, 15)}`,
    "x-o-gql-query": "mutation updateItems",
    "x-o-mart": "B2C",
    "x-o-platform": "rweb",
    "x-o-platform-version": "main-1.164.0-97e338f-1117T1104",
    "x-o-segment": "oaoh",
    "x-o-vertical": "EA",
    "x-enable-server-timing": "1",
    "x-latency-trace": "1",
    device_profile_ref_id: "4lybqbq3ewor_zzmw4vfw_2h2ha7zl83aonw",
    wm_mp: "true",
    wm_page_url: "https://www.lider.cl/",
    "sec-ch-ua":
      '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  }

  if (currentCookies) {
    headers.Cookie = currentCookies
  }

  try {
    const response = await fetch(LIDER_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    })

    const setCookieHeaders: string[] = []
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        setCookieHeaders.push(value)
      }
    })

    let updatedCookies = currentCookies
    if (setCookieHeaders.length > 0) {
      const newCookies = parseSetCookieHeaders(setCookieHeaders)
      updatedCookies = currentCookies
        ? mergeCookies(currentCookies, newCookies)
        : newCookies
    }

    const data = await response.json()

    // Log the request details for debugging
    if (!response.ok || data.errors) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        cartId: currentCartId,
        hasCookies: !!currentCookies,
        errors: data.errors,
        data: data.data,
        variables: JSON.stringify(variables, null, 2),
        offerId: offerId,
        productId: productId,
      }
      console.error(
        "addItemToCart failed:",
        JSON.stringify(errorDetails, null, 2)
      )
    }

    if (!response.ok) {
      return {
        success: false,
        cartId: currentCartId || null,
        lineItems: [],
        error: `HTTP ${response.status}: ${JSON.stringify(data)}`,
        response: data,
        cookieJar: {
          cookies: updatedCookies,
          cartId: currentCartId,
        },
      }
    }

    if (data.errors && data.errors.length > 0) {
      const errorMessage = data.errors[0]?.message || "GraphQL error"
      const updateItems = data?.data?.updateItems

      return {
        success: false,
        cartId: updateItems?.id || currentCartId || null,
        lineItems: updateItems?.lineItems || [],
        error: errorMessage,
        response: data,
        cookieJar: {
          cookies: updatedCookies,
          cartId: updateItems?.id || currentCartId,
        },
      }
    }

    const updateItems = data?.data?.updateItems

    if (!updateItems) {
      return {
        success: false,
        cartId: currentCartId || null,
        lineItems: [],
        error: "No updateItems in response",
        response: data,
        cookieJar: {
          cookies: updatedCookies,
          cartId: currentCartId,
        },
      }
    }

    const newCartId = updateItems?.id || currentCartId || null
    const lineItems = updateItems?.lineItems || []

    return {
      success: true,
      cartId: newCartId,
      lineItems: lineItems,
      response: updateItems,
      cookieJar: {
        cookies: updatedCookies,
        cartId: newCartId || undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      cartId: currentCartId || null,
      lineItems: [],
      error: error instanceof Error ? error.message : "Unknown error",
      cookieJar: cookieJar,
    }
  }
}

export async function POST(req: NextRequest) {
  const started = Date.now()

  try {
    const body = (await req.json()) as Body
    const {
      productUrl,
      productId,
      sku,
      quantity = 1,
      cartId,
      cookies,
      cookieJar: providedCookieJar,
      offerId: providedOfferId,
      productName: providedProductName,
    } = body

    let finalProductId: string | null = null
    let finalOfferId: string | undefined = providedOfferId
    let finalProductName: string | undefined = providedProductName

    if (productId) {
      finalProductId = productId
    } else if (sku) {
      finalProductId = sku
    } else if (productUrl) {
      if (isLiderUrl(productUrl)) {
        finalProductId = extractProductIdFromUrl(productUrl)
        if (!finalOfferId || !finalProductName) {
          const cookieJar = providedCookieJar || (await initializeSession())
          const productDetails = await fetchProductDetails(
            productUrl,
            cookieJar.cookies
          )
          finalOfferId = finalOfferId || productDetails.offerId
          finalProductName = finalProductName || productDetails.name
          if (productDetails.usItemId && !finalProductId) {
            finalProductId = productDetails.usItemId
          }
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid Lider URL",
            ms: Date.now() - started,
          },
          { status: 400 }
        )
      }
    }

    if (!finalProductId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID, SKU, or valid product URL required",
          ms: Date.now() - started,
        },
        { status: 400 }
      )
    }

    if (!finalOfferId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "offerId is required. Please provide it or a productUrl to fetch it automatically.",
          ms: Date.now() - started,
        },
        { status: 400 }
      )
    }

    const initialCookieJar: CookieJar = {
      cookies: cookies || providedCookieJar?.cookies || "",
      cartId: cartId || providedCookieJar?.cartId,
    }

    if (!initialCookieJar.cookies) {
      const session = await initializeSession()
      initialCookieJar.cookies = session.cookies
    }

    // Try to initialize cart if we don't have a cartId
    // Note: If this fails, we'll still try updateItems which may create the cart automatically
    if (!initialCookieJar.cartId) {
      const cartInitialized = await initializeCart(initialCookieJar)
      initialCookieJar.cookies = cartInitialized.cookies
      initialCookieJar.cartId =
        cartInitialized.cartId || initialCookieJar.cartId

      // Log cart initialization result
      if (!initialCookieJar.cartId) {
        console.warn(
          "Cart initialization did not return a cartId, will try updateItems without cartId",
          {
            hasCookies: !!initialCookieJar.cookies,
          }
        )
      }
    }

    const result = await addItemToCart(
      finalProductId,
      quantity,
      initialCookieJar,
      finalOfferId,
      finalProductName
    )

    const ms = Date.now() - started

    const beforeCount =
      result.success && result.lineItems.length > 0
        ? result.lineItems.length - 1
        : 0
    const afterCount = result.lineItems.length

    const response = NextResponse.json({
      success: result.success,
      url: productUrl || null,
      productId: finalProductId,
      offerId: finalOfferId,
      cartId: result.cartId || initialCookieJar.cartId,
      lineItems: result.lineItems,
      beforeCount: beforeCount,
      afterCount: afterCount,
      addToCartResponseStatus: result.success ? 200 : 500,
      addToCartResponseUrl: LIDER_GRAPHQL_ENDPOINT,
      addToCartResponseItems: result.response,
      error: result.error,
      ms,
      cookieJar: result.cookieJar,
      debug: {
        cartInitialized: !!initialCookieJar.cartId,
        hasCookies: !!initialCookieJar.cookies,
      },
    })

    if (result.cookieJar?.cookies) {
      response.headers.set("X-Cart-Cookies", result.cookieJar.cookies)
    }
    if (result.cookieJar?.cartId) {
      response.headers.set("X-Cart-Id", result.cookieJar.cartId)
    }

    return response
  } catch (err: unknown) {
    const ms = Date.now() - started
    const errorMessage = err instanceof Error ? err.message : String(err)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Error desconocido",
        ms,
      },
      { status: 500 }
    )
  }
}
