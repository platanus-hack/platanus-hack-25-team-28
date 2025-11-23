"use client"

import React, { useEffect, useRef } from "react"

type InteractiveRevealBackgroundProps = {
  backgroundImageUrl?: string
  children: React.ReactNode
  revealRadius?: number
  testMode?: boolean
}

export function InteractiveRevealBackground({
  backgroundImageUrl = "/images/supermarket-aisle.png",
  children,
  revealRadius = 150,
  testMode = false,
}: InteractiveRevealBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cursor = useRef({ x: -1000, y: -1000 })
  const smoothCursor = useRef({ x: -1000, y: -1000 }) // Smoothed cursor position
  const velocity = useRef({ x: 0, y: 0 })
  const revealStrength = useRef(0) // How much the reveal is "open" (0 = closed, 1 = fully open)
  const trail = useRef<
    Array<{ x: number; y: number; alpha: number; size: number }>
  >([])
  const requestRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const isDesktop = window.innerWidth >= 1024
    if (!isDesktop) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    const container = containerRef.current
    if (!container) return

    const handleResize = () => {
      if (canvas && container) {
        const rect = container.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const newX = e.clientX - rect.left
      const newY = e.clientY - rect.top

      // Calculate velocity
      velocity.current = {
        x: newX - cursor.current.x,
        y: newY - cursor.current.y,
      }

      cursor.current = { x: newX, y: newY }
    }

    container.addEventListener("mousemove", onMouseMove)

    // Draw a smooth blob that reacts to movement
    const drawBlob = (
      x: number,
      y: number,
      size: number,
      alpha: number,
      vel: { x: number; y: number }
    ) => {
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y)
      const direction = Math.atan2(vel.y, vel.x)

      // Create organic shape with subtle deformation based on movement
      const points = 40 // Many points for ultra-smooth edges
      ctx.beginPath()

      for (let i = 0; i <= points; i++) {
        const angle = (Math.PI * 2 * i) / points

        // Organic, wobbly deformation
        const angleFromDirection = angle - direction
        const stretchFactor =
          Math.cos(angleFromDirection) * Math.min(speed / 40, 0.25)

        // More pronounced organic variation for wobbly effect
        const organicVariation =
          Math.sin(angle * 3) * 0.12 +
          Math.cos(angle * 5) * 0.1 +
          Math.sin(angle * 7) * 0.08

        const r = size * (1 + stretchFactor + organicVariation)
        const px = x + Math.cos(angle) * r
        const py = y + Math.sin(angle) * r

        if (i === 0) {
          ctx.moveTo(px, py)
        } else {
          // Smooth bezier curves
          const prevAngle = (Math.PI * 2 * (i - 1)) / points
          const prevAngleFromDirection = prevAngle - direction
          const prevStretchFactor =
            Math.cos(prevAngleFromDirection) * Math.min(speed / 40, 0.25)
          const prevOrganicVariation =
            Math.sin(prevAngle * 3) * 0.12 +
            Math.cos(prevAngle * 5) * 0.1 +
            Math.sin(prevAngle * 7) * 0.08
          const prevR = size * (1 + prevStretchFactor + prevOrganicVariation)

          const controlAngle1 = prevAngle + (angle - prevAngle) * 0.33
          const controlAngle2 = prevAngle + (angle - prevAngle) * 0.66

          const cpR1 = (prevR + r) / 2
          const cpR2 = (prevR + r) / 2

          const cp1x = x + Math.cos(controlAngle1) * cpR1
          const cp1y = y + Math.sin(controlAngle1) * cpR1
          const cp2x = x + Math.cos(controlAngle2) * cpR2
          const cp2y = y + Math.sin(controlAngle2) * cpR2

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px, py)
        }
      }

      ctx.closePath()

      // Soft gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5)
      gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`)
      gradient.addColorStop(0.6, `rgba(0, 0, 0, ${alpha * 0.6})`)
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.fillStyle = gradient
      ctx.fill()
    }

    const animate = () => {
      if (!ctx || !canvas) return

      // Clear the entire canvas first to remove previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw a completely solid opaque white background
      ctx.globalCompositeOperation = "source-over"

      if (testMode) {
        ctx.fillStyle = "rgba(245, 245, 247, 0.3)"
      } else {
        // Solid opaque white
        ctx.fillStyle = "#f5f5f7"
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Now switch to destination-out mode to punch holes (only if revealing)
      ctx.globalCompositeOperation = "destination-out"

      const { x, y } = cursor.current

      // Smooth cursor movement (lerp)
      smoothCursor.current.x += (x - smoothCursor.current.x) * 0.15
      smoothCursor.current.y += (y - smoothCursor.current.y) * 0.15

      // Decay velocity
      velocity.current.x *= 0.9
      velocity.current.y *= 0.9

      if (x !== -1000 && y !== -1000) {
        const speed = Math.sqrt(
          velocity.current.x ** 2 + velocity.current.y ** 2
        )

        // Progressively open/close the reveal based on movement
        if (speed > 0.5) {
          // Mouse is moving - open the reveal progressively
          revealStrength.current += (1 - revealStrength.current) * 0.2
        } else {
          // Mouse stopped - close the reveal progressively
          revealStrength.current += (0 - revealStrength.current) * 0.1
        }

        // Clamp to exactly 0 when very close to avoid floating point issues
        if (revealStrength.current < 0.02) {
          revealStrength.current = 0
        }

        // Only draw if reveal is actually open
        if (revealStrength.current > 0) {
          // Add to trail when moving and reveal is opening
          if (speed > 0.5 && revealStrength.current > 0.2) {
            trail.current.push({
              x: smoothCursor.current.x,
              y: smoothCursor.current.y,
              alpha: 1,
              size: revealRadius,
            })

            // Limit trail length
            if (trail.current.length > 20) {
              trail.current.shift()
            }
          }

          // Update and draw trail
          trail.current = trail.current.filter((point) => {
            point.alpha -= 0.05
            return point.alpha > 0
          })

          for (const point of trail.current) {
            drawBlob(
              point.x,
              point.y,
              point.size,
              point.alpha * 0.4 * revealStrength.current,
              velocity.current
            )
          }

          // Draw main blob with reveal strength controlling opacity
          drawBlob(
            smoothCursor.current.x,
            smoothCursor.current.y,
            revealRadius,
            revealStrength.current,
            velocity.current
          )
        } else {
          // Clear trail when reveal is closed
          trail.current = []
        }
      }

      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (container) {
        container.removeEventListener("mousemove", onMouseMove)
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [revealRadius, testMode])

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 -z-20 hidden bg-cover bg-center lg:block"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        aria-hidden="true"
      />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 -z-10 hidden lg:block"
        style={{ opacity: 1 }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 -z-10 bg-white lg:hidden" />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
