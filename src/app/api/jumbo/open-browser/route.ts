// app/api/jumbo/open-browser/route.ts
import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { BrowserContext, chromium, Page, Response } from "playwright"

type Body = {
  productUrl: string
  keepOpen?: boolean // deja el browser abierto para ver
  headless?: boolean // override si quieres
  slowMoMs?: number // para ver mejor los clicks
}

const USER_DATA_DIR = path.join(process.cwd(), ".pw-user-data")

async function acceptCookies(page: Page) {
  // 1) banner normal
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

  // 2) OneTrust en shadow DOM
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
    "h1", // title
    "[data-testid='product-name']",
    "text=/\\$\\s*\\d{1,3}(\\.\\d{3})*/", // price text
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

async function getOrderFormCount(page: Page) {
  // Jumbo/cencosud suele usar orderForm VTEX
  // Intentamos leer cart desde window (si existe) o por fetch
  return page.evaluate(async () => {
    // Intento 1: endpoint VTEX clásico
    try {
      const r = await fetch("/api/checkout/pub/orderForm", {
        credentials: "include",
      })
      if (r.ok) {
        const data = await r.json()
        return (data?.items?.length ?? 0) as number
      }
    } catch {}

    // Intento 2: endpoint groceries BFF (el que viste en logs)
    try {
      const r2 = await fetch(
        "https://be-reg-groceries-bff-jumbo.ecomm.cencosud.com/cart",
        { credentials: "include" }
      )
      if (r2.ok) {
        const data2 = await r2.json()
        return (data2?.items?.length ?? 0) as number
      }
    } catch {}

    return 0
  })
}

export async function POST(req: NextRequest) {
  let context: BrowserContext | null = null
  let page: Page | null = null

  const started = Date.now()

  try {
    const body = (await req.json()) as Body
    const { productUrl } = body
    const keepOpen = body.keepOpen ?? false

    const headless =
      body.headless ?? (process.env.NODE_ENV === "production" ? true : false)

    const slowMo = body.slowMoMs ?? (headless ? 0 : 120)

    if (!productUrl) {
      return NextResponse.json(
        { success: false, error: "productUrl requerido" },
        { status: 400 }
      )
    }

    // Contexto persistente para que se vea y guarde cookies
    context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless,
      slowMo,
      viewport: { width: 1280, height: 800 },
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    })

    page = await context.newPage()

    // Capturar respuesta a addToCart
    const addToCartResponse: {
      status: number | null
      url: string | null
      items: unknown | null
    } = { status: null, url: null, items: null }

    const addToCartPromise = new Promise<void>((resolve) => {
      page!.on("response", async (res: Response) => {
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

    // Scroll a CTA por si está abajo
    await page.mouse.wheel(0, 800)
    await page.waitForTimeout(500)

    const addBtn = await findAddButton(page)
    if (!addBtn) {
      throw new Error("No encontré botón Agregar")
    }

    const beforeCount = await getOrderFormCount(page)

    await addBtn.click({ timeout: 10000 })

    // Espera a que ocurra el request real (si no, timeout igual)
    await Promise.race([
      addToCartPromise,
      page.waitForTimeout(8000).then(() => {}),
    ])

    // dale un poco de tiempo a la UI
    await page.waitForTimeout(1200)

    const afterCount = await getOrderFormCount(page)

    const ms = Date.now() - started

    const success =
      (addToCartResponse.status ?? 0) >= 200 &&
      (addToCartResponse.status ?? 0) < 300

    const payload = {
      success,
      url: productUrl,
      beforeCount,
      afterCount,
      addToCartResponseStatus: addToCartResponse.status,
      addToCartResponseUrl: addToCartResponse.url,
      addToCartResponseItems: addToCartResponse.items,
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
