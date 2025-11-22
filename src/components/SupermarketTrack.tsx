"use client"

import React, { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { LiderProduct } from "@/types"
import { ShoppingCart } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

interface SupermarketTrackProps {
  isAddingItems: boolean
  productsToAnimate: LiderProduct[]
  onItemAdded: (item: LiderProduct) => void
  onSequenceComplete: () => void
}

export default function SupermarketTrack({
  isAddingItems,
  productsToAnimate,
  onItemAdded,
  onSequenceComplete,
}: SupermarketTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)
  const shelvesRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [flyingItem, setFlyingItem] = useState<LiderProduct | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [flyingItemPos, setFlyingItemPos] = useState({ x: 0, y: 0, scale: 1 })

  // Parallax Scroll Effect
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(shelvesRef.current, {
        xPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  // Adding Items Sequence
  useEffect(() => {
    if (!isAddingItems || productsToAnimate.length === 0) return

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        onComplete: onSequenceComplete,
      })

      // Animate first 4 items (or fewer)
      const itemsToFly = productsToAnimate.slice(0, 4)
      const remainingItems = productsToAnimate.slice(4)

      itemsToFly.forEach((item, index) => {
        // Find the product card on the shelf (we'll mock positions for now since real shelf logic is hard)
        // In a real app, we'd use getBoundingClientRect of the specific shelf item
        // Here we'll spawn them from random positions on the "shelf" area

        const startX = 200 + index * 150 // Mock shelf positions
        const startY = 150

        timeline.call(
          () => {
            // Trigger the visual "fly"
            const cartRect = cartRef.current?.getBoundingClientRect()
            const containerRect = containerRef.current?.getBoundingClientRect()

            if (cartRect && containerRect) {
              // Calculate relative end position (cart center)
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const endX =
                cartRect.left - containerRect.left + cartRect.width / 2
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const endY =
                cartRect.top - containerRect.top + cartRect.height / 4

              // Create a flying element
              const flyer = document.createElement("div")
              flyer.className =
                "fixed z-50 w-24 h-24 bg-white rounded-xl shadow-xl border border-gray-100 p-2 pointer-events-none"
              flyer.innerHTML = `<img src="${item.imageUrl}" class="w-full h-full object-contain" />`

              // Set initial position (fixed to screen to avoid scroll issues during animation)
              // Actually, let's use the container relative if we can, but fixed is safer for "flying" across contexts
              // We need to calculate screen positions for the start/end

              const screenStartX = containerRect.left + startX
              const screenStartY = containerRect.top + startY

              flyer.style.left = `${screenStartX}px`
              flyer.style.top = `${screenStartY}px`
              flyer.style.opacity = "0"

              document.body.appendChild(flyer)

              // Animation
              gsap
                .timeline()
                .set(flyer, { opacity: 0, scale: 0.5 })
                .to(flyer, { opacity: 1, scale: 1, duration: 0.2 }) // Appear on shelf
                .to(
                  flyer,
                  {
                    left: cartRect.left + 20,
                    top: cartRect.top,
                    scale: 0.2,
                    opacity: 0.5,
                    duration: 0.6,
                    ease: "power2.inOut",
                    onComplete: () => {
                      document.body.removeChild(flyer)
                      onItemAdded(item)

                      // Cart bounce
                      gsap.to(cartRef.current, {
                        scale: 1.1,
                        y: 5,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1,
                      })
                    },
                  },
                  "+=0.3"
                )
            } else {
              // Fallback if refs missing
              onItemAdded(item)
            }
          },
          null,
          index * 1.2
        ) // Stagger start times
      })

      // Handle remaining items quickly
      timeline.call(
        () => {
          remainingItems.forEach((item) => onItemAdded(item))
        },
        null,
        "+=0.5"
      )
    }, containerRef)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddingItems, productsToAnimate])

  return (
    <div
      ref={containerRef}
      className="relative h-[60vh] w-full overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 md:h-[80vh]"
    >
      {/* Background Shelves (Blurred) */}
      <div
        ref={shelvesRef}
        className="absolute top-0 left-0 flex h-full w-[200%] items-center opacity-50"
        style={{ transform: "translate3d(0,0,0)" }} // Force GPU
      >
        {/* Repeated Shelf Pattern */}
        <div className="h-[70%] w-full bg-[url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1600&q=80')] bg-contain bg-repeat-x blur-[2px] filter" />
      </div>

      {/* Middle Layer: "Active" Shelf items (Visual decoration) */}
      <div className="absolute top-[20%] left-10 flex gap-8 md:left-32">
        {/* We could render productsToAnimate here if we wanted them to physically disappear from shelf, 
            but for now we use the background image and just spawn flyers */}
        {isAddingItems &&
          productsToAnimate.slice(0, 4).map((item, i) => (
            <div
              key={`shelf-${i}`}
              className="h-32 w-32 rounded-xl border border-gray-100 bg-white p-2 opacity-0 shadow-sm"
              // The GSAP animation creates the visual flyer, these are just placeholders/anchors if we needed them
              style={{
                transform: `translateX(${i * 150}px)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img
                src={item.imageUrl}
                className="h-full w-full object-contain"
              />
            </div>
          ))}
      </div>

      {/* Floor */}
      <div className="absolute bottom-0 h-[20%] w-full border-t border-gray-300 bg-gray-200" />

      {/* Cart */}
      <div
        ref={cartRef}
        className="absolute bottom-[10%] left-[50%] z-20 -translate-x-1/2 transform md:left-[30%]"
      >
        <div className="relative h-48 w-48 md:h-64 md:w-64">
          {/* Stylized Cart SVG/Image */}
          <div className="flex h-full w-full items-center justify-center">
            {/* Simple CSS Cart or SVG */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="h-full w-full fill-white/50 text-text-main"
            >
              <path
                d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                fill="currentColor"
              />
              <path
                d="M20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                fill="currentColor"
              />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>

            {/* Floating Badge Count */}
            <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-accent-primary font-bold text-white shadow-lg">
              <span className="text-lg">
                {/* This could be animated externally */}
                <ShoppingCart size={20} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
