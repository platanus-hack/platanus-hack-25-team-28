import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { BrowserContext, chromium } from "playwright"

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

    await new Promise((resolve) => setTimeout(resolve, 500))
  } catch {}
}

export async function POST(req: NextRequest) {
  let context: BrowserContext | null = null

  try {
    const body = await req.json()
    const { headless = false } = body

    await cleanupLockFiles()

    context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless,
      slowMo: headless ? 0 : 120,
      viewport: { width: 1280, height: 800 },
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    })

    const page = await context.newPage()

    await page.goto("https://www.jumbo.cl/mi-carro", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })

    await page.waitForTimeout(3000)

    const cartContinuarButton = page
      .locator('button.cart-button-order-submit:has-text("Continuar")')
      .first()

    await cartContinuarButton.waitFor({ state: "visible", timeout: 10000 })

    await page.waitForTimeout(1000)

    await cartContinuarButton.click({ timeout: 10000 })
    await page.waitForTimeout(1000)

    const upsellContinue = page
      .locator(
        'button.primary-btn.upselling-cart-order-btn:has-text("Continuar")'
      )
      .first()
    try {
      if (await upsellContinue.isVisible()) {
        await upsellContinue.click({ timeout: 10000 })
        await page.waitForTimeout(2000)
      }
    } catch {}

    const deliveryModal = page
      .locator(
        'div:has-text("Selecciona un modo de entrega"), div:has-text("Seleccionar un modo de entrega")'
      )
      .first()
    try {
      if (await deliveryModal.isVisible({ timeout: 3000 })) {
        const radioLocator = deliveryModal.locator(
          'input.input-radio-button[type="radio"], input[type="radio"]'
        )
        const radio = radioLocator.first()
        await radio.scrollIntoViewIfNeeded().catch(() => {})
        const attempts = [
          async () => {
            await radio.check({ timeout: 2000 })
            return true
          },
          async () => {
            await radio.click({ timeout: 2000 })
            return true
          },
          async () => {
            await deliveryModal
              .locator("label")
              .first()
              .click({ timeout: 2000 })
            return true
          },
          async () => {
            const handle = await radio.elementHandle()
            if (!handle) return false
            await handle.evaluate((el: HTMLInputElement) => el.click())
            return true
          },
          async () => {
            const box = await radio.boundingBox()
            if (!box) return false
            await page.mouse.click(
              box.x + box.width / 2,
              box.y + box.height / 2
            )
            return true
          },
          async () => {
            await radio.evaluate((el: HTMLInputElement) => {
              el.checked = true
              el.dispatchEvent(new Event("input", { bubbles: true }))
              el.dispatchEvent(new Event("change", { bubbles: true }))
            })
            return true
          },
        ]
        for (const attempt of attempts) {
          try {
            await attempt()
            await page.waitForTimeout(300)
            const confirmBtn = deliveryModal
              .locator(
                'button:has-text("Confirmar"), button:has-text("Confirm")'
              )
              .first()
            if (await confirmBtn.isEnabled().catch(() => false)) break
          } catch {}
        }
        const confirmBtn = deliveryModal
          .locator('button:has-text("Confirmar"), button:has-text("Confirm")')
          .first()
        await confirmBtn
          .waitFor({ state: "visible", timeout: 5000 })
          .catch(() => {})
        for (let i = 0; i < 3; i++) {
          try {
            if (await confirmBtn.isEnabled().catch(() => false)) {
              await confirmBtn.click({ timeout: 5000 })
              break
            }
          } catch {}
          await page.waitForTimeout(500)
        }
        await page.waitForTimeout(1500)
      }
    } catch {}

    await page.waitForURL("**/checkout/identification", { timeout: 30000 })
    await page.waitForTimeout(2000)

    const continuarButton1 = page
      .locator('button.cart-button-order-submit:has-text("Continuar")')
      .first()

    await continuarButton1.waitFor({ state: "visible", timeout: 10000 })

    await page.waitForTimeout(1000)

    await continuarButton1.click({ timeout: 10000 })
    await page.waitForTimeout(3000)

    await page.waitForURL("**/checkout/delivery", { timeout: 30000 })
    await page.waitForTimeout(2000)

    const continuarButton2 = page
      .locator('button.cart-button-order-submit:has-text("Continuar")')
      .first()

    await continuarButton2.waitFor({ state: "visible", timeout: 10000 })

    await page.waitForTimeout(1000)

    await continuarButton2.click({ timeout: 10000 })
    await page.waitForTimeout(3000)

    await page.waitForURL("**/checkout/payment", { timeout: 30000 })
    await page.waitForTimeout(3000)

    const checkbox = page
      .locator('input[type="checkbox"][name="Terms Acceptation"]')
      .first()

    await checkbox.waitFor({ state: "visible", timeout: 10000 })

    await page.waitForTimeout(1000)

    await checkbox.click({ timeout: 10000 })
    await page.waitForTimeout(1000)

    const pagarButton = page
      .locator('button.cart-button-order-submit:has-text("Pagar")')
      .first()

    await pagarButton.waitFor({ state: "visible", timeout: 10000 })

    await page.waitForTimeout(1000)

    await pagarButton.click({ timeout: 10000 })
    await page.waitForTimeout(5000)

    const currentUrl = page.url()

    return NextResponse.json({
      success: true,
      message: "Purchase completed successfully - clicked Pagar button",
      currentUrl,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined

    console.error("Error in complete-purchase:", errorMessage)
    console.error("Stack:", errorStack)

    try {
      if (context) {
        await context.close().catch(() => {})
        await cleanupLockFiles()
      }
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Unknown error",
        stack: errorStack,
      },
      { status: 500 }
    )
  }
}
