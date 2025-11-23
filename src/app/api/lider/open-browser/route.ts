// app/api/lider/open-browser/route.ts
import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { BrowserContext, chromium, Page, Response } from "playwright"
import {
  resolveUserDataDir,
  withUserDataDirLock,
} from "@/lib/playwrightUserDataDir"

type Body = {
  productUrl: string
  keepOpen?: boolean // deja el browser abierto para ver
  headless?: boolean // override si quieres
  slowMoMs?: number // para ver mejor los clicks
}

const USER_DATA_DIR = resolveUserDataDir(".pw-user-data-lider")

async function acceptCookies(page: Page) {
  // Lider cookie banners
  const candidates = [
    "button:has-text('Aceptar')",
    "button:has-text('Aceptar todas')",
    "button:has-text('Aceptar cookies')",
    "[data-testid='accept-cookies']",
    "#accept-cookies",
  ]

  for (const sel of candidates) {
    const btn = page.locator(sel).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(500)
      return true
    }
  }

  return false
}

async function waitForProductPageReady(page: Page) {
  // Wait for page to be interactive (less strict)
  await page.waitForLoadState("domcontentloaded").catch(() => {})
  await page.waitForTimeout(3000) // Give JS time to render

  // Just check that body exists
  try {
    await page.locator("body").waitFor({ timeout: 10000 })
  } catch {
    throw new Error("Timeout esperando página de producto lista")
  }

  // Additional wait for dynamic content
  await page.waitForTimeout(2000)
}

// Unused function - kept for potential future use
// async function findAddButton(page: Page) {
//   // Try multiple strategies to find the add to cart button
//   const selectors = [
//     "button:has-text('Agregar')",
//     "button:has-text('Añadir al carrito')",
//     "button:has-text('Añadir')",
//     "button:has-text('Agregar al carrito')",
//     "[data-testid='add-to-cart']",
//     "button[id*='add-to-cart']",
//     "button[aria-label*='agregar']",
//     "button[aria-label*='añadir']",
//     "button[class*='add-to-cart']",
//     "button[class*='addToCart']",
//     // Generic button that might be the add button
//     "button:has-text('carrito')",
//   ]
//
//   for (const sel of selectors) {
//     try {
//       const loc = page.locator(sel).first()
//       if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
//         return loc
//       }
//     } catch {}
//   }
//
//   // Last resort: try to find any button that looks like an add button
//   try {
//     const allButtons = await page.locator("button").all()
//     for (const btn of allButtons) {
//       const text = (await btn.textContent()) || ""
//       const lowerText = text.toLowerCase()
//       if (
//         lowerText.includes("agregar") ||
//         lowerText.includes("añadir") ||
//         lowerText.includes("carrito")
//       ) {
//         if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
//           return btn
//         }
//       }
//     }
//   } catch {}
//
//   return null
// }

async function getCartFromPage(page: Page) {
  // Try to get cart info from the page
  return page.evaluate(async () => {
    // Try to intercept GraphQL responses or read from localStorage/cookies
    try {
      // Check if there's cart info in localStorage
      const cartData =
        localStorage.getItem("cart") || localStorage.getItem("cartId")
      if (cartData) {
        try {
          return JSON.parse(cartData)
        } catch {
          return { cartId: cartData }
        }
      }

      // Try to read cartId from cookies
      const cookies = document.cookie
      const cartIdMatch = cookies.match(/cartId=([^;]+)/)
      if (cartIdMatch) {
        return { cartId: cartIdMatch[1] }
      }

      return null
    } catch {
      return null
    }
  })
}

async function handleLiderOpenBrowser(req: NextRequest) {
  let context: BrowserContext | null = null
  let page: Page | null = null

  const started = Date.now()

  try {
    const body = (await req.json()) as Body
    const { productUrl } = body
    const keepOpen = body.keepOpen ?? false

    // Default to headless: false for Lider to handle PerimeterX challenge
    // After first successful run, cookies persist and headless: true will work
    const headless = body.headless ?? false

    const slowMo = body.slowMoMs ?? (headless ? 0 : 120)

    if (!productUrl) {
      return NextResponse.json(
        { success: false, error: "productUrl requerido" },
        { status: 400 }
      )
    }

    // Contexto persistente para que se vea y guarde cookies
    // Using enhanced stealth techniques to bypass PerimeterX
    context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless,
      slowMo,
      viewport: { width: 1280, height: 800 },
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
      // Add extra HTTP headers to look more like a real browser
      extraHTTPHeaders: {
        "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
      },
    })

    page = await context.newPage()

    // Enhanced stealth: Override webdriver detection
    await page.addInitScript(() => {
      // Remove webdriver flag
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      })

      // Mock chrome object
      interface ChromeMock {
        runtime: Record<string, unknown>
        loadTimes: () => void
        csi: () => void
        app: Record<string, unknown>
      }
      ;(window as unknown as { chrome: ChromeMock }).chrome = {
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      }

      // Mock permissions
      type NavigatorWithPermissions = Navigator & {
        permissions?: {
          query: (parameters: { name: string }) => Promise<PermissionStatus>
        }
      }
      const nav = window.navigator as NavigatorWithPermissions
      const originalQuery = nav.permissions?.query
      if (originalQuery) {
        nav.permissions = {
          ...nav.permissions,
          query: (parameters: { name: string }) =>
            parameters.name === "notifications"
              ? Promise.resolve({
                  state: Notification.permission,
                } as PermissionStatus)
              : originalQuery(parameters),
        }
      }

      // Mock plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      })

      // Mock languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["es-CL", "es", "en-US", "en"],
      })

      // Override getParameter to avoid detection
      const getParameter = WebGLRenderingContext.prototype.getParameter
      WebGLRenderingContext.prototype.getParameter = function (
        parameter: number
      ) {
        if (parameter === 37445) {
          return "Intel Inc."
        }
        if (parameter === 37446) {
          return "Intel Iris OpenGL Engine"
        }
        return getParameter.call(this, parameter)
      }
    })

    // Set realistic user agent
    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
    })

    // Capturar respuestas GraphQL para obtener cartId
    const graphqlResponses: Array<{
      url: string
      status: number
      data: unknown
    }> = []

    page.on("response", async (res: Response) => {
      const url = res.url()
      if (
        url.includes("/orchestra/graphql") ||
        url.includes("/orchestra/cartxo/graphql")
      ) {
        try {
          const data = await res.json().catch(() => null)
          if (data) {
            graphqlResponses.push({
              url,
              status: res.status(),
              data,
            })
          }
        } catch {}
      }
    })

    // First, navigate to homepage to establish session and bypass PerimeterX
    console.log("Navigating to homepage first to establish session...")

    // Simulate human-like behavior: move mouse randomly
    await page.mouse.move(100, 100)
    await page.waitForTimeout(500)

    await page.goto("https://www.lider.cl", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })

    // Simulate reading the page (human behavior)
    await page.mouse.move(400, 300)
    await page.waitForTimeout(2000)
    await page.mouse.move(800, 500)
    await page.waitForTimeout(2000)

    // Scroll a bit (human behavior)
    await page.evaluate(() => {
      window.scrollTo(0, 300)
    })
    await page.waitForTimeout(3000)

    // Check if homepage was blocked
    const homepageInfo = await page.evaluate(() => ({
      url: window.location.href,
      isBlocked:
        window.location.href.includes("/blocked") ||
        document.title.includes("Robot"),
    }))

    if (homepageInfo.isBlocked) {
      console.log(
        "Homepage blocked, waiting for PerimeterX challenge (up to 90 seconds)..."
      )
      // Wait up to 90 seconds for challenge to complete automatically
      try {
        await page.waitForFunction(
          () =>
            !window.location.href.includes("/blocked") &&
            !document.title.includes("Robot"),
          { timeout: 90000 }
        )
        console.log("PerimeterX challenge completed automatically!")
        await page.waitForTimeout(5000)
      } catch {
        // If still blocked after 90 seconds, try one more navigation
        console.log(
          "Challenge didn't complete automatically, trying direct navigation..."
        )
        await page.goto("https://www.lider.cl", {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        })
        await page.waitForTimeout(10000)

        const retryInfo = await page.evaluate(() => ({
          url: window.location.href,
          isBlocked:
            window.location.href.includes("/blocked") ||
            document.title.includes("Robot"),
        }))

        if (retryInfo.isBlocked) {
          // Even with headless: false, PerimeterX might require manual interaction
          // Return a helpful error message
          throw new Error(
            "PerimeterX requiere interacción manual. Por favor, completa el desafío en el navegador que se abrió. " +
              "Después de completarlo una vez, las cookies se guardarán y funcionará automáticamente en futuras ejecuciones."
          )
        }
      }
    }

    // Accept cookies on homepage
    await acceptCookies(page)
    await page.waitForTimeout(2000)

    // Now navigate to product page
    console.log("Navigating to product page...")

    // More human-like behavior
    await page.mouse.move(600, 400)
    await page.waitForTimeout(1000)

    await page.goto(productUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })

    // Simulate reading the product page
    await page.mouse.move(500, 300)
    await page.waitForTimeout(2000)
    await page.evaluate(() => {
      window.scrollTo(0, 200)
    })
    await page.waitForTimeout(2000)

    // Wait for page to load and handle any cookie banners
    await page.waitForTimeout(3000)
    await acceptCookies(page)
    await page.waitForTimeout(3000)

    // Wait for page to be ready (less strict)
    try {
      await waitForProductPageReady(page)
    } catch (error) {
      // If timeout, continue anyway - page might still be usable
      console.warn("Page ready check timed out, continuing anyway:", error)
      await page.waitForTimeout(5000)
    }

    // Check if we're blocked by PerimeterX on product page
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body?.textContent?.substring(0, 200) || "",
        hasPerimeterX:
          document.body?.textContent?.includes("PerimeterX") || false,
        isBlocked:
          window.location.href.includes("/blocked") ||
          document.title.includes("Robot"),
      }
    })

    console.log("Product page info:", JSON.stringify(pageInfo, null, 2))

    // If PerimeterX blocked us on product page, wait for challenge to complete
    if (pageInfo.isBlocked || pageInfo.hasPerimeterX) {
      console.log(
        "Product page blocked by PerimeterX, waiting for challenge..."
      )

      // Wait for redirect away from blocked page (up to 60 seconds)
      try {
        await page.waitForFunction(
          () =>
            !window.location.href.includes("/blocked") &&
            !document.title.includes("Robot"),
          { timeout: 60000 }
        )
        console.log("PerimeterX challenge completed on product page")

        // Wait for the actual product page to load
        await page.waitForTimeout(5000)

        // Re-check if we're still blocked
        const newPageInfo = await page.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          isBlocked:
            window.location.href.includes("/blocked") ||
            document.title.includes("Robot"),
        }))

        if (newPageInfo.isBlocked) {
          throw new Error(
            "Página aún bloqueada por PerimeterX después de esperar. Intenta con headless: false para completar el desafío manualmente."
          )
        }
      } catch {
        throw new Error(
          "Página bloqueada por PerimeterX. Intenta con headless: false para completar el desafío manualmente la primera vez. Después las cookies persistirán."
        )
      }
    }

    // Wait longer for dynamic content to load
    await page.waitForTimeout(5000)

    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await page.waitForTimeout(2000)

    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(2000)

    // Get initial cart state (if any)
    const initialCart = await getCartFromPage(page)
    const beforeCount = initialCart?.lineItems?.length || 0

    // Try to find add button using JavaScript evaluation (more reliable)
    const buttonFound = await page.evaluate(() => {
      // Get all buttons and check their text
      const buttons = Array.from(document.querySelectorAll("button"))
      for (const btn of buttons) {
        const text = (btn.textContent || "").toLowerCase()
        const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase()
        if (
          text.includes("agregar") ||
          text.includes("añadir") ||
          text.includes("carrito") ||
          ariaLabel.includes("agregar") ||
          ariaLabel.includes("añadir")
        ) {
          // Make sure it's visible
          const rect = btn.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            return true
          }
        }
      }
      return false
    })

    if (!buttonFound) {
      // Wait a bit more and try again
      await page.waitForTimeout(3000)

      // Debug: Get all button texts
      const allButtonTexts = await page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll("button, a[role='button']")
        )
        return buttons
          .map((btn) => ({
            text: (btn.textContent || "").trim(),
            ariaLabel: btn.getAttribute("aria-label") || "",
            className: btn.className || "",
            visible:
              btn.getBoundingClientRect().width > 0 &&
              btn.getBoundingClientRect().height > 0,
          }))
          .filter((b) => b.text.length > 0 || b.ariaLabel.length > 0)
      })

      console.log(
        "Found buttons on page:",
        JSON.stringify(allButtonTexts, null, 2)
      )

      const buttonFoundRetry = await page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll("button, a[role='button']")
        )
        for (const btn of buttons) {
          const text = (btn.textContent || "").toLowerCase().trim()
          const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase()
          if (
            text.includes("agregar") ||
            text.includes("añadir") ||
            text.includes("carrito") ||
            ariaLabel.includes("agregar") ||
            ariaLabel.includes("añadir")
          ) {
            const rect = btn.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0) {
              return true
            }
          }
        }
        return false
      })

      if (!buttonFoundRetry) {
        // Take a screenshot for debugging
        await page
          .screenshot({ path: "lider-debug.png", fullPage: true })
          .catch(() => {})

        // Get more page info for debugging
        const debugInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodyLength: document.body?.textContent?.length || 0,
            buttonCount: document.querySelectorAll("button").length,
            linkCount: document.querySelectorAll("a").length,
            divCount: document.querySelectorAll("div").length,
            hasScripts: document.querySelectorAll("script").length,
          }
        })

        throw new Error(
          `No se encontró el botón Agregar. Debug: ${JSON.stringify(debugInfo)}, Botones: ${JSON.stringify(allButtonTexts.slice(0, 10))}`
        )
      }
    }

    // Now try to click using JavaScript evaluation (most reliable)
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll("button, a[role='button'], [onclick]")
      )
      for (const btn of buttons) {
        const text = (btn.textContent || "").toLowerCase().trim()
        const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase()
        const className = (btn.className || "").toLowerCase()

        // Check if this looks like an add to cart button
        if (
          text.includes("agregar") ||
          text.includes("añadir") ||
          text.includes("carrito") ||
          ariaLabel.includes("agregar") ||
          ariaLabel.includes("añadir") ||
          className.includes("add-to-cart") ||
          className.includes("addtocart")
        ) {
          // Make sure it's visible and clickable
          const rect = btn.getBoundingClientRect()
          const style = window.getComputedStyle(btn)
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.pointerEvents !== "none"
          ) {
            // Scroll into view
            btn.scrollIntoView({ behavior: "smooth", block: "center" })
            // Click it
            ;(btn as HTMLElement).click()
            return true
          }
        }
      }
      return false
    })

    if (!clicked) {
      // Last resort: try Playwright selectors
      try {
        await page.click("button:has-text('Agregar')", { timeout: 3000 })
      } catch {
        try {
          await page.click("button:has-text('Añadir')", { timeout: 3000 })
        } catch {
          throw new Error("No se pudo hacer click en el botón Agregar")
        }
      }
    }

    // Clear previous GraphQL responses
    graphqlResponses.length = 0

    // Wait for GraphQL response or timeout
    await Promise.race([
      page.waitForTimeout(8000).then(() => {}),
      new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (graphqlResponses.length > 0) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve()
        }, 8000)
      }),
    ])

    // Give UI time to update
    await page.waitForTimeout(1500)

    // Get final cart state
    const finalCart = await getCartFromPage(page)
    const afterCount = finalCart?.lineItems?.length || beforeCount + 1

    // Extract cartId from GraphQL responses
    let cartId: string | null = null
    let cartResponse: unknown = null

    for (const resp of graphqlResponses) {
      if (resp.status >= 200 && resp.status < 300) {
        const data = resp.data as {
          data?: {
            mergeAndGetCart?: { id?: string }
            updateItems?: { id?: string }
          }
        }
        cartId =
          data?.data?.mergeAndGetCart?.id || data?.data?.updateItems?.id || null
        if (cartId) {
          cartResponse = resp.data
          break
        }
      }
    }

    // If no cartId from GraphQL, try from cookies
    if (!cartId) {
      const cookies = await context.cookies()
      const cartCookie = cookies.find((c) => c.name === "cartId")
      if (cartCookie) {
        cartId = cartCookie.value
      }
    }

    const ms = Date.now() - started

    const success =
      graphqlResponses.some((r) => r.status >= 200 && r.status < 300) ||
      afterCount > beforeCount

    // Construct cart URL - Lider uses standard cart URL, cartId is in cookies
    const cartUrl =
      success && cartId
        ? `https://www.lider.cl/cart`
        : success
          ? `https://www.lider.cl/cart` // Even without cartId, try the cart URL
          : null

    const payload = {
      success,
      url: productUrl,
      cartId,
      cartUrl,
      beforeCount,
      afterCount,
      addToCartResponseStatus: graphqlResponses[0]?.status || null,
      addToCartResponseUrl: graphqlResponses[0]?.url || null,
      addToCartResponseItems: cartResponse,
      ms,
      note:
        keepOpen && !headless
          ? "Browser quedó abierto (dev). Cierra manualmente cuando termines."
          : undefined,
    }

    // Si quieres ver el browser, NO lo cierro (solo en dev)
    if (!(keepOpen && !headless)) {
      await context.close()
    }

    return NextResponse.json(payload)
  } catch (err: unknown) {
    const ms = Date.now() - started
    const errorMessage = err instanceof Error ? err.message : String(err)

    try {
      if (context) await context.close()
    } catch {}

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

export async function POST(req: NextRequest) {
  return withUserDataDirLock(USER_DATA_DIR, () => handleLiderOpenBrowser(req))
}
