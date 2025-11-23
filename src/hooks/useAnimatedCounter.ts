import { useEffect, useState } from "react"

/**
 * Hook that animates a number from start to end value over a duration
 */
export function useAnimatedCounter(
  targetValue: number,
  duration: number = 1000,
  enabled: boolean = true
): number {
  const [currentValue, setCurrentValue] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCurrentValue(targetValue)
      return
    }

    const startValue = 0
    const startTime = Date.now()
    const difference = targetValue - startValue

    if (difference === 0) {
      setCurrentValue(targetValue)
      return
    }

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const newValue = Math.round(startValue + difference * easeOutCubic)

      setCurrentValue(newValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCurrentValue(targetValue)
      }
    }

    const frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [targetValue, duration, enabled])

  return currentValue
}
