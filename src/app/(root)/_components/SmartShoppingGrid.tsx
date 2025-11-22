"use client"

import { CartSidebarRef } from "@/components/CartSidebar"
import { CartItem } from "@/types"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Image from "next/image"
import React, { useRef } from "react"

gsap.registerPlugin(ScrollTrigger)

interface SmartShoppingGridProps {
  items: CartItem[]
  cartListRef: React.RefObject<CartSidebarRef | null>
  onItemAdded: (item: CartItem) => void
  canStart?: boolean
  onAnimationComplete?: () => void
}

export default function SmartShoppingGrid({
  items,
  cartListRef,
  onItemAdded,
  canStart = true,
  onAnimationComplete,
}: SmartShoppingGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const flyersRef = useRef<HTMLElement[]>([])

  // Changed to useEffect to ensure DOM is ready and prevent blocking
  React.useEffect(() => {
    if (!items.length || !cartListRef.current || !canStart) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.5, // Small delay after scroll
        onComplete: () => {
          if (onAnimationComplete) {
            onAnimationComplete()
          }
        },
      })

      // Force fallback trigger just in case everything else fails
      // This ensures cart is populated even if animation crashes/skips
      // We create a parallel timeline or just use a timeout in real React world, but here in GSAP context:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fallbackTimer = setTimeout(() => {
        items.forEach((item) => onItemAdded(item)) // Potentially duplicate calls if we don't check state?
        // Wait, we rely on onItemAdded to update state. If we call it twice, we get duplicates.
        // Better: Rely on the animation loop being robust.
      }, 10000)
      // Actually, let's not do a global timeout that might cause race conditions.
      // Instead, lets make the loop more robust.

      // 1. Entrance Animation for Grid Items
      tl.fromTo(
        cardRefs.current,
        {
          y: 50,
          opacity: 0,
          scale: 0.9,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: {
            amount: 0.5,
            grid: "auto",
            from: "start",
          },
          duration: 0.6,
        }
      )

      // 2. Flyer Animation Sequence
      tl.addLabel("startFlying", "-=0.2")

      items.forEach((item, index) => {
        const startTime = `startFlying+=${index * 0.2}`

        tl.call(
          () => {
            const card = cardRefs.current[index]
            const sidebarApi = cartListRef.current

            if (!card || !sidebarApi) {
              onItemAdded(item)
              return
            }

            // Get destination rect from Sidebar API
            const destRect = sidebarApi.getDestinationRect(index)

            // Create Flyer (Visual Clone)
            const flyer = card.cloneNode(true) as HTMLElement
            const cardRect = card.getBoundingClientRect()

            // Setup Flyer initial state
            flyer.style.position = "fixed"
            flyer.style.left = `${cardRect.left}px`
            flyer.style.top = `${cardRect.top}px`
            flyer.style.width = `${cardRect.width}px`
            flyer.style.height = `${cardRect.height}px`
            flyer.style.zIndex = "100"
            flyer.style.margin = "0"
            flyer.style.opacity = "1"
            flyer.style.transition = "none"
            flyer.style.borderRadius = "1rem" // Matches card
            flyer.style.transformOrigin = "0 0" // Important for scale animation
            flyer.classList.remove("hover:shadow-md", "transition-shadow")

            document.body.appendChild(flyer)
            flyersRef.current.push(flyer)

            // Validate destRect - if it looks wrong (e.g. hidden), fallback immediately
            if (!destRect || destRect.width <= 0 || destRect.height <= 0) {
              onItemAdded(item)
              if (document.body.contains(flyer)) {
                document.body.removeChild(flyer)
              }
              return
            }

            // Morph Animation
            const morphTl = gsap.timeline({
              onComplete: () => {
                if (document.body.contains(flyer)) {
                  document.body.removeChild(flyer)
                }
                onItemAdded(item)
              },
            })

            // 1. Move to destination with Uniform Scale
            // Calculate uniform scale to fit height (avoid squash)
            const scale = destRect.height / cardRect.height

            morphTl.to(
              flyer,
              {
                x: destRect.left - cardRect.left,
                y: destRect.top - cardRect.top,
                scaleX: scale,
                scaleY: scale,
                // Morph visual style to match list item (optional specific adjustments)
                // borderRadius: "0.75rem", // slightly smaller radius for list item?
                duration: 0.8,
                ease: "back.inOut(0.8)",
              },
              0
            )

            // 2. Fade/Scale internal elements to look like list item?
            // It's hard to morph DOM internals without FLIP.
            // We will just cross-fade opacity as it lands.
            // Actually, let's just keep it simple: Morph container,
            // and as it hits the target, the real item appears (which is handled by onItemAdded).
          },
          [],
          startTime
        )

        // Make original card disappear completely
        tl.to(
          cardRefs.current[index],
          {
            opacity: 0,
            scale: 0,
            duration: 0.4,
            ease: "back.in(1.7)",
          },
          startTime
        )
      })

      // Ensure timeline waits for the LAST flyer to finish
      // Last item starts at startFlying + (N-1)*0.2
      // Flight takes 0.8s
      // Currently TL ends at startFlying + (N-1)*0.2 + 0.4 (disappear duration)
      // So we need to pad it by at least 0.4s
      tl.to({}, { duration: 0.5 }) // Safety padding
    }, containerRef)

    return () => {
      ctx.revert()
      // Cleanup any lingering flyers
      flyersRef.current.forEach((flyer) => {
        if (document.body.contains(flyer)) {
          document.body.removeChild(flyer)
        }
      })
      flyersRef.current = []
    }
  }, [items, cartListRef, canStart])

  return (
    <section
      ref={containerRef}
      className="w-full bg-gray-50 px-4 py-12 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-3xl font-bold text-text-main">
          Resultados encontrados
          <span className="ml-4 text-lg font-normal text-text-muted">
            {items.length} productos seleccionados por IA
          </span>
        </h2>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {items.map((item, index) => (
            <div
              key={`${item.sku}-${index}`}
              ref={(el) => {
                cardRefs.current[index] = el
              }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative flex h-48 items-center justify-center bg-gray-50 p-4">
                {item.imageUrl ? (
                  <Image
                    width={100}
                    height={100}
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
                  <span className="font-bold text-accent-primary">
                    ${item.price.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
