"use client"

import { CartItem } from "@/types"
import { useEffect, useState } from "react"
import CartSidebar from "./CartSidebar"
import SupermarketTrack from "./SupermarketTrack"

interface SupermarketExperienceProps {
  prompt: string
  targetCart: CartItem[]
  isFilling: boolean
  onFillingComplete: () => void
}

export default function SupermarketExperience({
  prompt,
  targetCart,
  isFilling,
  onFillingComplete,
}: SupermarketExperienceProps) {
  const [displayItems, setDisplayItems] = useState<CartItem[]>([])
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  // Reset display items when a new filling process starts
  useEffect(() => {
    if (isFilling) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayItems([])
    }
  }, [isFilling, targetCart])

  const handleItemAdded = (item: CartItem) => {
    setDisplayItems((prev) => {
      // Check if item already exists (simple dedupe logic if needed, though buildMockCart should return unique-ish items)
      return [item, ...prev]
    })
  }

  const total = displayItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <section
      id="experiencia"
      className="max-w-8xl relative mx-auto flex min-h-screen flex-col px-4 py-12 md:px-8"
    >
      {/* Header / Hint */}
      <div className="mb-8 space-y-2 text-center md:text-left">
        {prompt ? (
          <div className="mb-2 inline-block rounded-full border border-accent-primary/10 bg-accent-primary/5 px-4 py-2 text-sm font-medium text-accent-primary">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Entendimos: "{prompt}"
          </div>
        ) : (
          <div className="mb-2 inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-text-muted">
            Empieza escribiendo tu lista arriba
          </div>
        )}
        <h2 className="text-3xl font-bold text-text-main md:text-4xl">
          Así se arma tu carro en tiempo real.
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        {/* Main Stage: Supermarket Track */}
        <div className="relative z-10 flex-1">
          <SupermarketTrack
            isAddingItems={isFilling}
            productsToAnimate={targetCart}
            onItemAdded={handleItemAdded}
            onSequenceComplete={onFillingComplete}
          />
        </div>

        {/* Sidebar (Desktop) / Bottom Sheet (Mobile) */}
        <div className="relative z-20 lg:w-1/3">
          <CartSidebar
            items={displayItems}
            total={total}
            isOpen={isMobileCartOpen}
            onClose={() => setIsMobileCartOpen(false)}
          />

          {/* Mobile Trigger for Cart */}
          <div
            className="fixed right-4 bottom-4 left-4 z-30 flex cursor-pointer items-center justify-between rounded-2xl bg-text-main p-4 text-white shadow-2xl transition-transform active:scale-95 lg:hidden"
            onClick={() => setIsMobileCartOpen(true)}
          >
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">
                {displayItems.length} productos
              </span>
              <span className="font-bold">
                ${total.toLocaleString("es-CL")}
              </span>
            </div>
            <div className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold">
              Ver carro
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
