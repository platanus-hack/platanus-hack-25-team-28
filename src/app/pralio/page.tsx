"use client"

import { useEffect, useRef, useState } from "react"

export default function PralioTestPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [urls, setUrls] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [cartInfo, setCartInfo] = useState<{
    ready: boolean
    count: number
  } | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    totalProducts: number
    succeeded: number
    failed: number
    totalMs: number
    results?: unknown[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkoutTriggered, setCheckoutTriggered] = useState(false)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
    }
  }, [])

  const checkJobStatus = async (jobId: string) => {
    const response = await fetch(`/api/jumbo/add-multiple-async?jobId=${jobId}`)
    const data = await response.json()

    if (data.status === "completed") {
      if (checkoutTriggered) {
        return true
      }
      setCheckoutTriggered(true)
      setResult(data.result)
      setStatus("Products added! Waiting for browser to close...")

      await new Promise((resolve) => setTimeout(resolve, 3000))

      setStatus("Proceeding to checkout...")

      try {
        const purchaseResponse = await fetch("/api/jumbo/complete-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headless: false }),
        })

        const purchaseData = await purchaseResponse.json()

        if (purchaseData.success) {
          setStatus("Purchase completed successfully!")
        } else {
          setError(`Checkout failed: ${purchaseData.error}`)
        }
      } catch (err) {
        setError(
          `Checkout error: ${err instanceof Error ? err.message : "Unknown error"}`
        )
      }

      setLoading(false)
      setStatus(null)
      setCartInfo(null)
      return true
    } else if (data.status === "failed") {
      setError(data.error || "Job failed")
      setLoading(false)
      setStatus(null)
      setCartInfo(null)
      setCheckoutTriggered(false)
      return true
    } else if (data.status === "running") {
      const progress = data.progress
      if (progress) {
        setCartInfo({
          ready: progress.cartReady ?? false,
          count: progress.currentCartCount ?? 0,
        })
      }

      const ready =
        progress?.cartReady && (progress.currentCartCount ?? 0) > 0
          ? `🛒 Cart ready (${progress.currentCartCount} items)`
          : "⏳ Preparing cart..."

      setStatus(`${ready} - Adding products...`)
      return false
    } else {
      setStatus("Starting job...")
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    setStatus("Starting job...")
    setCheckoutTriggered(false)
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }

    try {
      const productLines = urls
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (productLines.length === 0) {
        throw new Error("Please enter at least one product")
      }

      if (!username || !password) {
        throw new Error("Please enter username and password")
      }

      const products = productLines.map((line) => {
        const parts = line.split(",").map((p) => p.trim())
        const url = parts[0]
        const quantity = parts[1] ? parseInt(parts[1], 10) : 1
        return { url, quantity: isNaN(quantity) ? 1 : quantity }
      })

      const response = await fetch("/api/jumbo/add-multiple-async", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products,
          loginFirst: true,
          username,
          password,
          headless: false,
          openCartAfter: true,
        }),
      })

      const { jobId } = await response.json()

      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }

      const poll = async () => {
        const done = await checkJobStatus(jobId)
        if (!done) {
          pollTimeoutRef.current = setTimeout(poll, 2000)
        } else {
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current)
            pollTimeoutRef.current = null
          }
        }
      }

      poll()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
      setStatus(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Jumbo Cart Test - Pralio
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Username (RUT)
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                placeholder="12345678-9"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label
                htmlFor="urls"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Products (URL and Quantity)
              </label>
              <textarea
                id="urls"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
                placeholder="https://www.jumbo.cl/producto1,2&#10;https://www.jumbo.cl/producto2,3&#10;https://www.jumbo.cl/producto3,1"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter product URL and quantity (comma-separated), one per line.
                Example: url,quantity
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-green-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {status || "Processing..."}
                </span>
              ) : (
                "Add Products to Cart"
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-green-800">
                    Success!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      <strong>Total Products:</strong> {result.totalProducts}
                    </p>
                    <p>
                      <strong>Succeeded:</strong> {result.succeeded}
                    </p>
                    <p>
                      <strong>Failed:</strong> {result.failed}
                    </p>
                    <p>
                      <strong>Total Time:</strong> {result.totalMs}ms
                    </p>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-green-800 hover:text-green-900">
                      View Details
                    </summary>
                    <pre className="mt-2 max-h-96 overflow-auto rounded border border-green-200 bg-white p-4 text-xs">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
