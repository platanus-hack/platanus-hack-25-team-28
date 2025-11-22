"use client"

import React, { useRef, useLayoutEffect, useEffect } from "react"
import { gsap } from "gsap"
import { ShoppingCart } from "lucide-react"
import { CartItem } from "@/types"
import Image from "next/image"

interface ProductRevealProps {
  prompt: string
  cartItems: CartItem[]
  onFunnelComplete: () => void
}

export default function ProductReveal({
  prompt,
  cartItems,
  onFunnelComplete,
}: ProductRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const cartTargetRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Keep track of animation timeline to kill it on unmount
  const masterTimeline = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          // Animation sequence complete
        },
      })

      masterTimeline.current = tl

      // 1. Entrance Animation
      // Cards stagger in
      tl.from(
        cardRefs.current,
        {
          y: 60,
          opacity: 0,
          scale: 0.8,
          stagger: {
            amount: 0.8,
            grid: "auto",
            from: "start",
          },
          duration: 0.8,
          clearProps: "transform", // clear transform after animation for clean layout
        },
        "-=0.4"
      )

      // 2. Auto-scroll
      // We calculate how much to scroll.
      // We want to scroll down to show more products, then maybe back up a bit or just stop.
      // Let's scroll to the bottom of the grid or a reasonable amount.
      const scrollDistance =
        (gridRef.current?.scrollHeight || 0) -
        (scrollContainerRef.current?.clientHeight || 0)

      if (scrollDistance > 0) {
        // Wait a bit after cards appear
        tl.to(
          scrollContainerRef.current,
          {
            scrollTop: scrollDistance > 500 ? 500 : scrollDistance, // Don't scroll too far if it's huge
            duration: 3,
            ease: "power1.inOut",
          },
          "+=0.2"
        )
      }

      // 3. Funnel Animation (Funnel into cart icon)
      // Wait a bit for user to see the products
      tl.addLabel("funnelStart", "+=1.5")

      // Get cart icon position
      const cartRect = cartTargetRef.current?.getBoundingClientRect()

      if (cartRect) {
        const cartCenterX = cartRect.left + cartRect.width / 2
        const cartCenterY = cartRect.top + cartRect.height / 2

        cardRefs.current.forEach((card, index) => {
          if (!card) return

          // We need to calculate relative movement because GSAP transforms are relative
          // but we want to move to a specific screen coordinate.
          // However, since the cards are in a scrolling container, getBoundingClientRect works best.
          // But animating "x" and "y" on an element in a generic flow is tricky if we want exact coordinates.
          // A robust way is FLIP or just calculating delta from current position.

          // To ensure it works even if scrolled, we capture positions right before animation
          // We'll use a function in .to() or just do a loop to build the timeline
        })

        // Since we are inside the context, we can loop and add to timeline
        cardRefs.current.forEach((card, index) => {
          if (!card) return

          tl.to(
            card,
            {
              // We use a function-based value or just-in-time calculation if we were not in a timeline building phase.
              // But here we build the timeline upfront.
              // Limitation: if user scrolls DURING the wait, the calculation might be off if we calculate now.
              // Best practice: use `gsap.to` inside an `onStart` of a timeline step or use a call().
              // But for simplicity in this strict sequence, we will assume auto-scroll finished and user hasn't scrolled wildly away.
              // Actually, let's lock overflow during funnel to be safe?

              x: function () {
                const r = card.getBoundingClientRect()
                return cartCenterX - (r.left + r.width / 2)
              },
              y: function () {
                const r = card.getBoundingClientRect()
                return cartCenterY - (r.top + r.height / 2)
              },
              scale: 0.1,
              opacity: 0,
              rotate: "random(-20, 20)",
              duration: 0.8,
              ease: "power3.in",
            },
            `funnelStart+=${index * 0.03}`
          )
        })
      }

      // Pulse the cart icon
      tl.to(
        cartTargetRef.current,
        {
          scale: 1.2,
          duration: 0.2,
          yoyo: true,
          repeat: 3,
        },
        "funnelStart+=0.5"
      )

      // 4. Cart Icon Slide to Right
      tl.to(
        cartTargetRef.current,
        {
          x: window.innerWidth < 768 ? 0 : 200, // Move right. On mobile maybe just fade out or move to bottom corner
          opacity: 0, // Fade out as it transitions to the real sidebar
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            onFunnelComplete()
          },
        },
        "+=0.2"
      )
    }, containerRef)

    return () => ctx.revert()
  }, [cartItems, onFunnelComplete])

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50 pt-20"
    >
      {/* Scrollable products area */}
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 px-4 pt-8 pb-24">
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide relative h-full w-full overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-xl"
          style={{ height: "calc(100vh - 140px)" }}
        >
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {cartItems.map((item, index) => {
              // Determine if card should be featured (larger)
              // Simple logic: every 7th item is large
              const isLarge = index > 0 && index % 7 === 0

              return (
                <div
                  key={item.sku + index}
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md ${
                    isLarge ? "md:col-span-2 md:row-span-2" : ""
                  }`}
                >
                  <div
                    className={`relative w-full ${isLarge ? "h-64" : "h-40"} flex items-center justify-center bg-gray-50 p-4`}
                  >
                    {/* Image placeholder or actual image if available */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div className="text-4xl font-bold text-gray-300">?</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-800">
                      {item.name}
                    </h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs text-gray-500 capitalize">
                        {item.category || "Producto"}
                      </span>
                      <span className="font-bold text-blue-600">
                        ${item.price.toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Cart icon target */}
      <div
        ref={cartTargetRef}
        className="fixed right-8 bottom-8 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-2xl shadow-blue-600/30"
      >
        <ShoppingCart className="h-8 w-8 text-white" />
      </div>
    </div>
  )
}
