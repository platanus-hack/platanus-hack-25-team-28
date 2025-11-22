"use client"

import Footer from "@/components/Footer"
import { CartItem } from "@/types"
import { buildMockCart } from "@/utils/cartUtils"
import { useEffect, useRef, useState } from "react"
import CartDrawer from "./_components/CartDrawer"
import ChatInterface from "./_components/ChatInterface"
import Hero from "./_components/Hero"
import ChatInterface from "./_components/ChatInterface"
import SmartShoppingGrid from "./_components/SmartShoppingGrid"
// import { gsap } from "gsap" // Still used if needed for other animations, but removing ScrollToPlugin if unused
// import { ScrollToPlugin } from "gsap/ScrollToPlugin"
// import { CustomEase } from "gsap/CustomEase"
// import { gsap } from "gsap" // Still used if needed for other animations, but removing ScrollToPlugin if unused
// import { ScrollToPlugin } from "gsap/ScrollToPlugin"
// import { CustomEase } from "gsap/CustomEase"

import { CartSidebarRef } from "@/components/CartSidebar"
import NavBar from "@/components/NavBar"

// Ensure plugins are registered
if (typeof window !== "undefined") {
  // gsap.registerPlugin(ScrollToPlugin, CustomEase)
  
  // CustomEase.create("ultraSmooth", "M0,0 C0.2,0 0.1,1 1,1") 
  // CustomEase.create("extremeExpo", "M0,0 C0.1,0 0.1,1 1,1") 
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [prompt, setPrompt] = useState("") // Keep prompt state for chat
  const [showChat, setShowChat] = useState(false)
  const [prompt, setPrompt] = useState("") // Keep prompt state for chat
  const [allProducts, setAllProducts] = useState<CartItem[]>([]) // The grid items
  const [cartItems, setCartItems] = useState<CartItem[]>([]) // The cart items
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSidebarReady, setIsSidebarReady] = useState(false)

  // Use separate refs for desktop and mobile to avoid collision
  const desktopCartRef = useRef<CartSidebarRef>(null)
  const mobileCartRef = useRef<CartSidebarRef>(null)

  // Check if sidebar is ready
  useEffect(() => {
    if (showResults && desktopCartRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSidebarReady(true)
    }
  }, [showResults, isCartOpen])

  const handleSearch = async (userPrompt: string) => {
    setPrompt(userPrompt)
  const handleSearch = async (userPrompt: string) => {
    setPrompt(userPrompt)
    setIsLoading(true)

    // Simulate AI delay
    setTimeout(() => {
      const results = buildMockCart() // Mock data
      setAllProducts(results)
      setCartItems([]) // Start with empty cart, they will fly in
      setShowResults(true)
      setShowChat(false) // Reset chat state
      setShowChat(false) // Reset chat state
      setIsLoading(false)

      // Wait for render then scroll and open cart
      setTimeout(() => {
        // Scroll to results so it takes up the full page
        // We use native scroll which leverages the smooth behavior from SmoothScroll.tsx
        const resultsElement = document.getElementById("results-section")
        if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        
        // Open cart slightly before/during scroll so it's ready for incoming items
        setIsCartOpen(true)
      }, 100)
    }, 2000)
  }

  const handleItemAdded = (item: CartItem) => {
    setCartItems((prev) => {
      // Simple dedupe if needed, or just add
      return [...prev, item]
    })
  }

  const handleGridAnimationComplete = () => {
      // Transition to Chat
      setShowChat(true)
      // We keep showResults=true so the container structure stays, 
      // but we swap the Grid component for the Chat component inside the layout.
      // Or we can use showResults to mean "Show the split layout" and use showChat to toggle content.
  }

  return (
    <main className="relative min-h-screen w-full bg-bg-page">
      <NavBar />
      <Hero onFillCart={handleSearch} isLoading={isLoading} />

      {showResults && (
        <div
          id="results-section"
          className="flex min-h-screen flex-col lg:flex-row"
        >
          <div className="flex-1">
            {!showChat ? (
                <SmartShoppingGrid
                  items={allProducts}
                  cartListRef={desktopCartRef}
                  onItemAdded={handleItemAdded}
                  canStart={isSidebarReady}
                  onAnimationComplete={handleGridAnimationComplete}
                />
            ) : (
                <div className="h-screen p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    <ChatInterface initialPrompt={prompt} cartItems={cartItems} />
                </div>
            )}
            {/* Footer inside the main content column */}
            <Footer />
          </div>
          {/* Desktop Sidebar Column */}
          <div className="relative hidden w-[350px] shrink-0 lg:block">
            <div className="sticky top-0 h-screen">
              <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cartItems}
                sidebarRef={desktopCartRef}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Drawer (only visible on small screens or when explicitly open on mobile) */}
      <div className="lg:hidden">
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cartItems}
          sidebarRef={mobileCartRef}
        />
      </div>
    </main>
  )
}
