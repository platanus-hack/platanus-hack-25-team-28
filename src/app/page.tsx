"use client"

import CartSidebar from "@/components/CartSidebar"
import ChatInterface from "@/components/ChatInterface"
import Footer from "@/components/Footer"
import Hero from "@/components/Hero"
import ProductReveal from "@/components/ProductReveal"
import { CartItem } from "@/types"
import { buildMockCart } from "@/utils/cartUtils"
import clsx from "clsx"
import { useState } from "react"

type ViewStep = "hero" | "productReveal" | "chat"

export default function Home() {
  const [viewStep, setViewStep] = useState<ViewStep>("hero")
  const [prompt, setPrompt] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  const handleSearch = (userPrompt: string) => {
    setPrompt(userPrompt)
    // Build cart immediately
    const newCart = buildMockCart()
    setCart(newCart)
    // Go to reveal view
    setViewStep("productReveal")
  }

  const handleFunnelComplete = () => {
    // Ensure cart is populated (fallback)
    if (cart.length === 0) {
      const newCart = buildMockCart()
      setCart(newCart)
    }
    setViewStep("chat")
    setShowCart(true)
  }

  // Legacy callback if ChatInterface still uses it, but we handle cart earlier now.
  // We can leave it empty or use it to ensure cart is open.
  // const handleRecommendationsReady = () => {
  //   setShowCart(true);
  // };

  return (
    <main className="fixed inset-0 flex h-screen w-full flex-col overflow-hidden bg-bg-page">
      {viewStep === "hero" && (
        <div className="flex-1 overflow-y-auto">
          <Hero onFillCart={handleSearch} />
          <Footer />
        </div>
      )}

      {viewStep === "productReveal" && (
        <ProductReveal
          prompt={prompt}
          cartItems={cart}
          onFunnelComplete={handleFunnelComplete}
        />
      )}

      {viewStep === "chat" && (
        <div className="flex h-screen flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="relative flex h-full flex-1 flex-col">
            <div className="flex-1 overflow-hidden">
              <ChatInterface initialPrompt={prompt} cartItems={cart} />
            </div>

            {/* Optional footer inside chat view */}
            <div className="border-t border-gray-200 bg-bg-page p-4 text-center text-xs text-text-muted">
              Supermarket AI Beta
            </div>
          </div>

          {/* Right Sidebar - Cart */}
          <div
            className={clsx(
              "z-30 h-full overflow-hidden border-l border-gray-200 bg-white shadow-2xl transition-all duration-500 ease-in-out",
              // Mobile: Fixed overlay. Desktop: Flex item that expands.
              "fixed top-0 right-0 bottom-0 lg:static",
              showCart
                ? "w-[85vw] translate-x-0 lg:w-[350px] lg:translate-x-0"
                : "w-[85vw] translate-x-full lg:w-0 lg:translate-x-0 lg:border-none"
            )}
          >
            <div className="relative h-full w-full">
              {/* Mobile Close Button */}
              <button
                onClick={() => setShowCart(false)}
                className={clsx(
                  "absolute top-4 right-4 z-50 rounded-full bg-white p-2 text-text-main shadow-md hover:bg-gray-100 lg:hidden",
                  !showCart && "hidden"
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <CartSidebar
                items={cart}
                total={cart.reduce((acc, item) => acc + item.price, 0)}
                isOpen={showCart}
                onClose={() => setShowCart(false)}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
