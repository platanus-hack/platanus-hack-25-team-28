"use client"

import Footer from "@/components/Footer"
import { CartItem, StoreName } from "@/types"
import { useCallback, useEffect, useRef, useState } from "react"
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
import { InteractiveRevealBackground } from "@/components/InteractiveRevealBackground"
import NavBar from "@/components/NavBar"
import { api } from "@/convex/_generated/api"
import { useAction } from "convex/react"

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
  const [liderCartItems, setLiderCartItems] = useState<CartItem[]>([])
  const [unimarcCartItems, setUnimarcCartItems] = useState<CartItem[]>([])
  const [jumboCartItems, setJumboCartItems] = useState<CartItem[]>([])
  const [activeStore, setActiveStore] = useState<StoreName>("Lider")
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = await recommendProducts({ userPrompt })

      const allNewItems: CartItem[] = []
      const liderItems: CartItem[] = []
      const unimarcItems: CartItem[] = []
      const jumboItems: CartItem[] = []

      results.forEach((storeResult) => {
        const storeName = storeResult.storeName
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = storeResult.selectedProducts.map((p: any) => ({
          id: p.id,
          sku: p.id, // Use id as sku for now (products from API use id)
          name: p.name,
          price: p.price || p.minPrice || 0,
          quantity: p.quantity || 1,
          imageUrl:
            p.imageUrl ||
            "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop",
          category: p.category || "Otros",
          url: `#`,
          store: storeName,
          date: new Date().toISOString(),
        }))

        allNewItems.push(...items)

        if (storeName === "Lider") liderItems.push(...items)
        else if (storeName === "Unimarc") unimarcItems.push(...items)
        else if (storeName === "Jumbo") jumboItems.push(...items)
      })

      setAllProducts(allNewItems)
      // Distribute items to their respective store carts
      setLiderCartItems(liderItems)
      setUnimarcCartItems(unimarcItems)
      setJumboCartItems(jumboItems)
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

  const handleItemAdded = useCallback(
    (item: CartItem) => {
      // Add to the store-specific cart based on item's store field
      const store = item.store || activeStore
      const updateCart = (prev: CartItem[]) => {
        const existingItemIndex = prev.findIndex((i) => i.sku === item.sku)
        if (existingItemIndex >= 0) {
          // Update quantity
          const newCart = [...prev]
          newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newCart[existingItemIndex].quantity + item.quantity,
          }
          return newCart
        }
        return [...prev, item]
      }

      if (store === "Lider") {
        setLiderCartItems(updateCart)
      } else if (store === "Unimarc") {
        setUnimarcCartItems(updateCart)
      } else if (store === "Jumbo") {
        setJumboCartItems(updateCart)
      }
    },
    [activeStore]
  )

  const handleGridAnimationComplete = useCallback(() => {
    // Transition to Chat
    setShowChat(true)
  }, [])

  const handleUpdateCart = (newItems: CartItem[]) => {
    // Distribute items to their respective store carts based on store field
    newItems.forEach((item) => {
      const store = item.store || activeStore
      const updateCart = (prev: CartItem[]) => {
        const existingItemIndex = prev.findIndex((i) => i.sku === item.sku)
        if (existingItemIndex >= 0) {
          // Update quantity
          const newCart = [...prev]
          newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newCart[existingItemIndex].quantity + item.quantity,
          }
          return newCart
        }
        return [...prev, item]
      }

      if (store === "Lider") {
        setLiderCartItems(updateCart)
      } else if (store === "Unimarc") {
        setUnimarcCartItems(updateCart)
      } else if (store === "Jumbo") {
        setJumboCartItems(updateCart)
      }
    })
  }

  const handleUpdateQuantity = (sku: string, quantity: number) => {
    // Update quantity in the active store's cart
    if (activeStore === "Lider") {
      setLiderCartItems((prev) => {
        if (quantity <= 0) {
          return prev.filter((item) => item.sku !== sku)
        }
        return prev.map((item) =>
          item.sku === sku ? { ...item, quantity } : item
        )
      })
    } else if (activeStore === "Unimarc") {
      setUnimarcCartItems((prev) => {
        if (quantity <= 0) {
          return prev.filter((item) => item.sku !== sku)
        }
        return prev.map((item) =>
          item.sku === sku ? { ...item, quantity } : item
        )
      })
    } else if (activeStore === "Jumbo") {
      setJumboCartItems((prev) => {
        if (quantity <= 0) {
          return prev.filter((item) => item.sku !== sku)
        }
        return prev.map((item) =>
          item.sku === sku ? { ...item, quantity } : item
        )
      })
    }
  }

  // Get active store's cart items
  const getActiveCartItems = (): CartItem[] => {
    if (activeStore === "Lider") return liderCartItems
    if (activeStore === "Unimarc") return unimarcCartItems
    if (activeStore === "Jumbo") return jumboCartItems
    return liderCartItems
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
                  cartItems={getActiveCartItems()}
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
                cart={getActiveCartItems()}
                activeStore={activeStore}
                onStoreChange={setActiveStore}
                sidebarRef={desktopCartRef}
                className="h-full"
                onUpdateQuantity={handleUpdateQuantity}
                liderCartCount={liderCartItems.length}
                unimarcCartCount={unimarcCartItems.length}
                jumboCartCount={jumboCartItems.length}
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
          cart={getActiveCartItems()}
          activeStore={activeStore}
          onStoreChange={setActiveStore}
          sidebarRef={mobileCartRef}
          onUpdateQuantity={handleUpdateQuantity}
          liderCartCount={liderCartItems.length}
          unimarcCartCount={unimarcCartItems.length}
          jumboCartCount={jumboCartItems.length}
        />
      </div>
    </main>
  )
}
