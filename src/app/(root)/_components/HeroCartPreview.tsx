"use client"

import { useAnimatedCounter } from "@/hooks/useAnimatedCounter"
import { useCartSimulation } from "@/hooks/useCartSimulation"
import { formatCurrency } from "@/utils/cartUtils"
import gsap from "gsap"
import { Loader2, ShoppingBag } from "lucide-react"
import { useEffect, useRef } from "react"

export default function HeroCartPreview() {
  const cardRef = useRef<HTMLDivElement>(null)
  const cardContentRef = useRef<HTMLDivElement>(null)

  // Cart simulation
  const { currentScenario, phase, typedPrompt, totalPrice, isTransitioning } =
    useCartSimulation()
  const animatedTotal = useAnimatedCounter(
    totalPrice,
    1500,
    phase === "SHOW_CART" || phase === "HOLD"
  )

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Card Floating Animation
      gsap.to(cardRef.current, {
        y: -15,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })

      // Card Parallax with Mouse - Enhanced to follow cursor
      const handleMouseMove = (e: MouseEvent) => {
        if (!cardRef.current) return
        const { clientX, clientY } = e
        const xPos = (clientX / window.innerWidth - 0.5) * 12
        const yPos = (clientY / window.innerHeight - 0.5) * 12

        gsap.to(cardRef.current, {
          rotateY: xPos,
          rotateX: -yPos,
          transformPerspective: 1000,
          duration: 0.4,
          ease: "power2.out",
        })
      }

      window.addEventListener("mousemove", handleMouseMove)
      return () => window.removeEventListener("mousemove", handleMouseMove)
    }, cardRef)

    return () => ctx.revert()
  }, [])

  // Handle card content transitions
  useEffect(() => {
    if (!cardContentRef.current) return

    const tween = gsap.to(cardContentRef.current, {
      opacity: isTransitioning ? 0 : 1,
      duration: 0.5,
      ease: isTransitioning ? "power2.in" : "power2.out",
    })

    return () => {
      tween.kill()
    }
  }, [isTransitioning])

  // Get accent color classes
  const getAccentClasses = (accent: string) => {
    switch (accent) {
      case "green":
        return "text-accent-success bg-accent-success/10"
      case "blue":
        return "text-accent-primary bg-accent-primary/10"
      case "red":
        return "text-red-500 bg-red-500/10"
      default:
        return "text-accent-success bg-accent-success/10"
    }
  }

  const getAccentTextClass = (accent: string) => {
    switch (accent) {
      case "green":
        return "text-accent-success"
      case "blue":
        return "text-accent-primary"
      case "red":
        return "text-red-500"
      default:
        return "text-accent-success"
    }
  }

  return (
    <div
      className="hidden justify-center lg:flex"
      style={{ perspective: "1000px" }}
    >
      <div
        ref={cardRef}
        className="relative w-[380px] rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div ref={cardContentRef}>
          {/* Card Header */}
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${getAccentClasses(currentScenario.accent)}`}
              >
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Tu Carro
                </p>
                <p
                  className={`font-bold ${getAccentTextClass(currentScenario.accent)}`}
                >
                  {currentScenario.supermarket}
                </p>
              </div>
            </div>
            <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500">
              #8392
            </span>
          </div>

          {/* Content based on phase */}
          {phase === "TYPING" && (
            <div className="mb-6 min-h-[200px]">
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                  Prompt
                </p>
                <p className="mt-2 text-sm text-text-main">
                  {typedPrompt}
                  <span className="animate-pulse">|</span>
                </p>
              </div>
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-text-muted">Escribiendo...</p>
              </div>
            </div>
          )}

          {phase === "PROCESSING" && (
            <div className="mb-6 flex min-h-[200px] flex-col items-center justify-center">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent-primary" />
              <p className="text-sm font-medium text-text-main">Pensando...</p>
              <p className="mt-1 text-xs text-text-muted">
                Seleccionando productos
              </p>
            </div>
          )}

          {(phase === "SHOW_CART" || phase === "HOLD") && (
            <>
              {/* Mini Items */}
              <div className="mb-6 space-y-3">
                {currentScenario.items.map((item, i) => {
                  const Icon = item.icon
                  // Parse quantity (e.g., "2x" -> 2, "1.5kg" -> 1.5)
                  const quantityMatch = item.quantity.match(/^(\d+\.?\d*)/)
                  const quantity = quantityMatch
                    ? parseFloat(quantityMatch[1])
                    : 1
                  const itemTotal = item.price * quantity
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                        <Icon size={24} className="text-text-muted" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-medium text-text-main">
                          {item.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-text-main">
                        {formatCurrency(itemTotal)}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div className="border-t border-gray-100 pt-2">
                <div className="flex items-end justify-between">
                  <span className="text-sm text-text-muted">
                    Total estimado
                  </span>
                  <span
                    className={`text-2xl font-bold ${getAccentTextClass(currentScenario.accent)}`}
                  >
                    {formatCurrency(animatedTotal)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
