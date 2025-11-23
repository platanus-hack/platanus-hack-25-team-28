import fs from "fs"
import { NextResponse } from "next/server"
import path from "path"
import { BrowserContext, chromium, Page } from "playwright"
import {
  resolveUserDataDir,
  withUserDataDirLock,
} from "@/lib/playwrightUserDataDir"

const USER_DATA_DIR = resolveUserDataDir(".pw-user-data")

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

type LoginBody = {
  username: string
  password: string
}

async function handleLogin(req: Request) {
  let context: BrowserContext | null = null

  try {
    const body = (await req.json()) as LoginBody
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "username and password are required",
        },
        { status: 400 }
      )
    }

    const rut = username

    await cleanupLockFiles()

    context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false,
      slowMo: 200,
      viewport: { width: 1280, height: 800 },
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    })

    const page = await context.newPage()
    const isLoggedIn = await performLogin(page, rut, password)

    const currentUrl = page.url()

    if (isLoggedIn) {
      await page.waitForTimeout(2000)
      await page.close()
      await context.close()

      return NextResponse.json({
        success: true,
        message: "Login successful. Session saved.",
        finalUrl: currentUrl,
      })
    } else {
      await page.waitForTimeout(5000)
      await page.close()
      await context.close()

      return NextResponse.json(
        {
          success: false,
          error: "Login failed. Still on login page.",
          currentUrl: currentUrl,
          rut: rut.substring(0, 3) + "***",
        },
        { status: 401 }
      )
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    try {
      if (context) await context.close()
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  return withUserDataDirLock(USER_DATA_DIR, () => handleLogin(req))
}
