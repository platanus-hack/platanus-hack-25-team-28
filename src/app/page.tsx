"use client"

import { useState } from "react"
import Hero from "@/components/Hero"
import ChatInterface from "@/components/ChatInterface"
import CartSidebar from "@/components/CartSidebar"
import Footer from "@/components/Footer"
import { LiderProduct } from "@/types"
import { buildMockCart } from "@/utils/cartUtils"
import clsx from "clsx"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [cart, setCart] = useState<LiderProduct[]>([])
  const [isChatActive, setIsChatActive] = useState(false)
  const [showCart, setShowCart] = useState(false)

  const handleSearch = (userPrompt: string) => {
    setPrompt(userPrompt)
    setIsChatActive(true)
  }

  const handleRecommendationsReady = () => {
    // Build mock cart based on "AI analysis"
    const newCart = buildMockCart()
    setCart(newCart)
    setShowCart(true)
  }

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-bg-page">
      {!isChatActive ? (
        // Initial View
        <>
          <Hero onFillCart={handleSearch} />
          <Footer />
        </>
      ) : (
        // Conversation View
        <div className="flex h-screen flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="relative flex h-full flex-1 flex-col">
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                initialPrompt={prompt}
                onRecommendationsReady={handleRecommendationsReady}
              />
            </div>

            {/* Optional footer inside chat view if needed, or just keep it clean */}
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
                ? "w-[85vw] translate-x-0 lg:w-[350px] lg:translate-x-0 xl:lg:w-[400px]"
                : "w-[85vw] translate-x-full lg:w-0 lg:translate-x-0 lg:border-none"
            )}
          >
             <div className="w-full h-full relative">
                 {/* Mobile Close Button */}
                 <button 
                    onClick={() => setShowCart(false)}
                    className={clsx(
                        "lg:hidden absolute top-4 right-4 z-50 p-2 bg-white rounded-full shadow-md text-text-main hover:bg-gray-100",
                        !showCart && "hidden"
                    )}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
