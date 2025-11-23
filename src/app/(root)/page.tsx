"use client"

import Footer from "@/components/Footer"
import { CartItem } from "@/types"
import { useEffect, useRef, useState } from "react"
import CartDrawer from "./_components/CartDrawer"
import ChatInterface from "./_components/ChatInterface"
import Hero from "./_components/Hero"
import SmartShoppingGrid from "./_components/SmartShoppingGrid"
// import { gsap } from "gsap" // Still used if needed for other animations, but removing ScrollToPlugin if unused
// import { ScrollToPlugin } from "gsap/ScrollToPlugin"
// import { CustomEase } from "gsap/CustomEase"
// import { gsap } from "gsap" // Still used if needed for other animations, but removing ScrollToPlugin if unused
// import { ScrollToPlugin } from "gsap/ScrollToPlugin"
// import { CustomEase } from "gsap/CustomEase"

import { CartSidebarRef } from "@/components/CartSidebar"
import NavBar from "@/components/NavBar"
import { api } from "@/convex/_generated/api"
import { useAction } from "convex/react"
import { InteractiveRevealBackground } from "@/components/InteractiveRevealBackground"

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
  const [allProducts, setAllProducts] = useState<CartItem[]>([]) // The grid items
  const [cartItems, setCartItems] = useState<CartItem[]>([]) // The cart items
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSidebarReady, setIsSidebarReady] = useState(false)

  // Use separate refs for desktop and mobile to avoid collision
  const desktopCartRef = useRef<CartSidebarRef>(null)
  const mobileCartRef = useRef<CartSidebarRef>(null)

  const recommendProducts = useAction(api.recommendations.recommendProducts)

  // Check if sidebar is ready
  useEffect(() => {
    if (showResults && desktopCartRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSidebarReady(true)
    }
  }, [showResults, isCartOpen])

  const handleSearch = async (userPrompt: string) => {
    setPrompt(userPrompt)
    setIsLoading(true)

    try {
      const result = await recommendProducts({ userPrompt })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newItems: any = result.selectedProducts.map((p) => ({
        id: p.id,
        sku: p.id, // Use id as sku for now (products from API use id)
        name: p.name,
        price: p.minPrice || 0,
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop",
        imageUrl:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop",
        category: p.category || "Otros",
        url: `#`,
        store: "Lider",
        date: new Date().toISOString(),
      }))

      setAllProducts(newItems)
      setCartItems([]) // Start with empty cart, they will fly in
      setShowResults(true)
      setShowChat(false) // Reset chat state
      setIsLoading(false)

      // Wait for render then scroll and open cart
      setTimeout(() => {
        // Scroll to results so it takes up the full page
        const resultsElement = document.getElementById("results-section")
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }

        // Open cart slightly before/during scroll so it's ready for incoming items
        setIsCartOpen(true)
      }, 100)
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setIsLoading(false)
      // Handle error (maybe show a toast or alert)
    }
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
  }

  const handleUpdateCart = (newItems: CartItem[]) => {
    // Add new items to the cart
    setCartItems((prev) => {
      // We could check for duplicates here
      return [...prev, ...newItems]
    })
    // Also update allProducts if we want them to show up in the grid?
    // But the grid might be hidden or static now.
    // If we want to animate them, we might need to update allProducts and trigger animation?
    // For now, just updating the cart is enough for the chat interaction.
  }

  const handleUpdateQuantity = (sku: string, quantity: number) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        // Remove item from cart
        return prev.filter((item) => item.sku !== sku)
      }
      // Update quantity for existing item
      return prev.map((item) =>
        item.sku === sku ? { ...item, quantity } : item
      )
    })
  }

  return (
      <main className="relative min-h-screen w-full">
        <NavBar />
        <InteractiveRevealBackground>
          <Hero onFillCart={handleSearch} isLoading={isLoading} />
        </InteractiveRevealBackground>

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
              <div className="animate-in fade-in slide-in-from-bottom-4 h-screen p-6 duration-700 ease-out">
                <ChatInterface
                  initialPrompt={prompt}
                  cartItems={cartItems}
                  onUpdateCart={handleUpdateCart}
                />
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
                onUpdateQuantity={handleUpdateQuantity}
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
          onUpdateQuantity={handleUpdateQuantity}
        />
      </div>
      </main>
  )
}
