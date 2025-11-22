"use client"

import Footer from "@/components/Footer"
import NavBar from "@/components/NavBar"
import { CartItem } from "@/types"
import { buildMockCart } from "@/utils/cartUtils"
import { useState } from "react"
import CartDrawer from "./_components/CartDrawer"
import ChatInterface from "./_components/ChatInterface"
import Hero from "./_components/Hero"
import ProductReveal from "./_components/ProductReveal"

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

  return (
    <main className="fixed inset-0 flex h-screen w-full flex-col overflow-hidden bg-bg-page">
      <NavBar />
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
          <CartDrawer
            isOpen={showCart}
            onClose={() => setShowCart(false)}
            cart={cart}
          />
        </div>
      )}
    </main>
  )
}
