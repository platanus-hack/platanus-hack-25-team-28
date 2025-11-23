import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { BrowserContext, chromium, Page, Response } from "playwright"

type Product = {
  url: string
  quantity?: number
}

type Body = {
  productUrls?: string[]
  products?: Product[]
  headless?: boolean
  keepOpen?: boolean
  openCartAfter?: boolean
  loginFirst?: boolean
  username?: string
  password?: string
}

const USER_DATA_DIR = path.join(process.cwd(), ".pw-user-data")

async function cleanupLockFiles() {
  try {
    const lockFile = path.join(USER_DATA_DIR, "SingletonLock")
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile)
    }
    const socketFile = path.join(USER_DATA_DIR, "SingletonSocket")
    if (fs.existsSync(socketFile)) {
      fs.unlinkSync(socketFile)
    }
    const cookieFile = path.join(USER_DATA_DIR, "SingletonCookie")
    if (fs.existsSync(cookieFile)) {
      fs.unlinkSync(cookieFile)
    }
  } catch {}
}

async function acceptCookies(page: Page) {
  const candidates = [
    "#onetrust-accept-btn-handler",
    "button:has-text('Aceptar todas las cookies')",
    "button:has-text('Aceptar cookies')",
  ]

  for (const sel of candidates) {
    const btn = page.locator(sel).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 3000 }).catch(() => {})
      return true
    }
  }

  try {
    const clicked = await page.evaluate(() => {
      const host = document.querySelector("#onetrust-banner-sdk")
      if (!host) return false
      const root = (host as Element & { shadowRoot?: ShadowRoot | null })
        .shadowRoot
      if (!root) return false
      const btn =
        root.querySelector("#onetrust-accept-btn-handler") ||
        Array.from(root.querySelectorAll("button")).find((b) =>
          (b.textContent || "").toLowerCase().includes("aceptar")
        )
      if (!btn) return false
      ;(btn as HTMLButtonElement).click()
      return true
    })
    return clicked
  } catch {
    return false
  }
}

async function waitForProductPageReady(page: Page) {
  const selectors = [
    "h1",
    "[data-testid='product-name']",
    "text=/\\$\\s*\\d{1,3}(\\.\\d{3})*/",
    "button:has-text('Agregar')",
  ]

  for (const sel of selectors) {
    try {
      await page.locator(sel).first().waitFor({ timeout: 15000 })
      return sel
    } catch {}
  }
  throw new Error("Timeout esperando PDP listo")
}

async function findAddButton(page: Page) {
  const selectors = [
    "button:has-text('Agregar')",
    "button:has-text('Añadir')",
    "[data-testid='add-to-cart']",
    "button[id*='add-to-cart']",
  ]

  for (const sel of selectors) {
    const loc = page.locator(sel).first()
    if (await loc.isVisible().catch(() => false)) return loc
  }
  return null
}

async function performLogin(page: Page, rut: string, password: string) {
  await page.goto("https://www.jumbo.cl/login-page", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  })

  await page.waitForTimeout(2000)

  const currentUrl = page.url()
  if (!currentUrl.includes("/login-page")) {
    console.log("Already logged in - redirected to:", currentUrl)
    return true
  }

  await acceptCookies(page)

  const emailInput = page.locator('input[name="email"]')
  const emailVisible = await emailInput.isVisible().catch(() => false)

  if (!emailVisible) {
    console.log("Email input not visible - assuming already logged in")
    return true
  }

  await emailInput.fill(rut)
  await page.waitForTimeout(500)

  const passwordInput = page.locator('input[name="Clave"]')
  const passwordVisible = await passwordInput.isVisible().catch(() => false)

  if (!passwordVisible) {
    console.log("Password input not visible - assuming already logged in")
    return true
  }

  await passwordInput.fill(password)
  await page.waitForTimeout(500)

  const submitButton = page.locator('.login-page button[type="submit"]').first()
  const submitVisible = await submitButton.isVisible().catch(() => false)

  if (!submitVisible) {
    console.log("Submit button not visible - assuming already logged in")
    return true
  }

  await submitButton.click({ timeout: 10000 })
  await page.waitForURL("**/*", { timeout: 30000 })
  await page.waitForTimeout(3000)

  const finalUrl = page.url()
  const isLoggedIn = !finalUrl.includes("/login-page")

  return isLoggedIn
}

async function addProductToCart(
  page: Page,
  productUrl: string,
  quantity: number = 1
) {
  const started = Date.now()

  const addToCartResponse: {
    status: number | null
    url: string | null
    items: unknown | null
    guestId: string | null
  } = { status: null, url: null, items: null, guestId: null }

  const addToCartPromise = new Promise<void>((resolve) => {
    page.on("request", async (req) => {
      const url = req.url()
      if (url.includes("/cart/items")) {
        const headers = req.headers()
        const guestIdHeader = headers["x-provider-guest-id"]
        if (guestIdHeader) {
          addToCartResponse.guestId = guestIdHeader
        }
      }
    })
    page.on("response", async (res: Response) => {
      const url = res.url()
      if (url.includes("/cart/items")) {
        addToCartResponse.status = res.status()
        addToCartResponse.url = url
        try {
          addToCartResponse.items = await res.json()
        } catch {
          addToCartResponse.items = null
        }
        resolve()
      }
    })
  })

  await page.goto(productUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  })

  await waitForProductPageReady(page)
  await acceptCookies(page)

  await page.mouse.wheel(0, 800)
  await page.waitForTimeout(500)

  const addBtn = await findAddButton(page)
  if (!addBtn) {
    throw new Error("No encontré botón Agregar")
  }

  await addBtn.click({ timeout: 10000 })

  await Promise.race([
    addToCartPromise,
    page.waitForTimeout(8000).then(() => {}),
  ])

  await page.waitForTimeout(1200)

  const drawerCloseButton = page.locator("button.drawer-close").first()
  const drawerVisible = await drawerCloseButton.isVisible().catch(() => false)
  if (drawerVisible) {
    await drawerCloseButton.click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(500)
  }

  if (quantity > 1) {
    const plusButton = page
      .locator('button.add[data-cnstrc-btn="add_to_cart"]')
      .first()
    const currentQuantityInput = page.locator('input[type="number"]').first()

    const currentQtyStr = await currentQuantityInput
      .inputValue()
      .catch(() => "1")
    const currentQty = parseInt(currentQtyStr) || 1

    if (currentQty > quantity) {
      const minusButton = page.locator("button.minus").first()
      for (let i = currentQty; i > quantity; i--) {
        const isVisible = await minusButton.isVisible().catch(() => false)
        if (isVisible) {
          await minusButton.click({ timeout: 5000 })
          await page.waitForTimeout(800)
        }
      }
    } else if (currentQty < quantity) {
      for (let i = currentQty; i < quantity; i++) {
        const isVisible = await plusButton.isVisible().catch(() => false)
        if (isVisible) {
          await plusButton.click({ timeout: 5000 })
          await page.waitForTimeout(800)
        }
      }
    }
  }

  const ms = Date.now() - started

  const success =
    (addToCartResponse.status ?? 0) >= 200 &&
    (addToCartResponse.status ?? 0) < 300

  return {
    success,
    url: productUrl,
    addToCartResponseStatus: addToCartResponse.status,
    addToCartResponseUrl: addToCartResponse.url,
    addToCartResponseItems: addToCartResponse.items,
    guestId: addToCartResponse.guestId,
    ms,
  }
}

export async function POST(req: NextRequest) {
  let context: BrowserContext | null = null
  const started = Date.now()

  try {
    const body = (await req.json()) as Body
    const {
      productUrls,
      products,
      headless = true,
      keepOpen = false,
      openCartAfter = false,
      loginFirst = false,
      username,
      password,
    } = body

    const productList: Product[] =
      products || productUrls?.map((url) => ({ url, quantity: 1 })) || []

    if (productList.length === 0) {
      return NextResponse.json(
        { success: false, error: "products or productUrls required" },
        { status: 400 }
      )
    }

    await cleanupLockFiles()

    context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless,
      slowMo: headless ? 0 : 120,
      viewport: { width: 1280, height: 800 },
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    })

    if (loginFirst) {
      const rut = username || process.env.LOGIN_RUT
      const password_val = password || process.env.LOGIN_PASSWORD

      if (!rut || !password_val) {
        await context.close()
        return NextResponse.json(
          {
            success: false,
            error:
              "username and password are required (either in body or as LOGIN_RUT/LOGIN_PASSWORD env vars)",
          },
          { status: 400 }
        )
      }

      const loginPage = await context.newPage()
      const isLoggedIn = await performLogin(loginPage, rut, password_val)
      await loginPage.close()

      if (!isLoggedIn) {
        await context.close()
        return NextResponse.json(
          {
            success: false,
            error: "Login failed. Check credentials.",
          },
          { status: 401 }
        )
      }
    }

    let guestId: string | undefined = undefined
    const cookies = await context.cookies()
    const guestCookie = cookies.find(
      (c) =>
        c.name.includes("guest") ||
        c.name.includes("Guest") ||
        c.name.includes("provider")
    )
    if (guestCookie) {
      guestId = guestCookie.value
    }

    async function addAndConfirm(product: Product) {
      if (!context) throw new Error("Browser context not initialized")
      const page = await context.newPage()
      try {
        await page.goto(product.url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        })
        let productName = ""
        try {
          productName = await page.locator("h1").first().innerText()
        } catch {
          productName = ""
        }
        const addResult = await addProductToCart(
          page,
          product.url,
          product.quantity || 1
        )

        if (!guestId && addResult.guestId) {
          guestId = addResult.guestId
        }

        let confirmed = false
        let retries = 0
        while (!confirmed && retries < 10) {
          const cartUrl = `https://be-reg-groceries-bff-jumbo.ecomm.cencosud.com/cart?store=jumboclj512&simulationTotals=true`
          const headers = {
            accept: "application/json, text/plain, */*",
            apikey:
              process.env.JUMBO_API_KEY ||
              "be-reg-groceries-jumbo-cart-rhk68rqi0adn",
            "x-provider-guest-id": guestId || "",
            "x-client-platform": "web",
            "x-client-version": "3.1.26",
            origin: "https://www.jumbo.cl",
            referer: "https://www.jumbo.cl/",
          }
          const res = await fetch(cartUrl, {
            method: "GET",
            headers,
          })
          if (res.ok) {
            const cart = await res.json()
            if (productName && cart.items) {
              const normalizedProductName = productName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
              const matchedItem = cart.items.find((item: { name?: string }) => {
                if (!item.name) return false
                const normalizedItemName = item.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")
                return (
                  normalizedItemName.includes(normalizedProductName) ||
                  normalizedProductName.includes(normalizedItemName)
                )
              })
              if (matchedItem) {
                confirmed = true
              }
            }
          }
          if (!confirmed) {
            await new Promise((r) => setTimeout(r, 1000))
            retries++
          }
        }
        await page.close()
        return {
          url: product.url,
          quantity: product.quantity || 1,
          success: confirmed,
          data: addResult,
          error: confirmed ? null : "Not confirmed in cart",
        }
      } catch (err) {
        await page.close().catch(() => {})
        return {
          url: product.url,
          quantity: product.quantity || 1,
          success: false,
          data: null,
          error: (err as Error).message,
        }
      }
    }

    const results = await Promise.all(productList.map(addAndConfirm))

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    const totalMs = Date.now() - started

    if (openCartAfter && succeeded > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const cartPage = await context.newPage()
      await cartPage.goto("https://www.jumbo.cl/", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      })
      if (!keepOpen) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        await context.close()
      }
      return NextResponse.json({
        success: failed === 0,
        totalProducts: productList.length,
        succeeded,
        failed,
        results,
        totalMs,
        cartOpened: true,
        note: keepOpen
          ? "Browser quedó abierto con el carrito. Cierra manualmente cuando termines."
          : "Carrito abierto brevemente",
      })
    }

    if (!keepOpen) {
      await context.close()
    }

    return NextResponse.json({
      success: failed === 0,
      totalProducts: productList.length,
      succeeded,
      failed,
      results,
      totalMs,
      note: keepOpen
        ? "Browser quedó abierto. Cierra manualmente cuando termines."
        : undefined,
    })
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
