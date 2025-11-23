import { useEffect, useMemo, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Croissant,
  Drumstick,
  Carrot,
  Coffee,
  CircleDot,
  Droplet,
  Package,
  UtensilsCrossed,
} from "lucide-react"

export type Supermarket = "Jumbo" | "Lider" | "Unimarc"
export type AccentColor = "green" | "blue" | "red"
export type Phase =
  | "TYPING"
  | "PROCESSING"
  | "SHOW_CART"
  | "HOLD"
  | "TRANSITION"

export interface MockCartItem {
  name: string
  quantity: string // e.g., "2x"
  price: number // in CLP
  icon: LucideIcon
}

export interface Scenario {
  supermarket: Supermarket
  accent: AccentColor
  prompt: string
  items: MockCartItem[]
}

// Scenario configurations
const scenarios: Scenario[] = [
  {
    supermarket: "Jumbo",
    accent: "green",
    prompt: "Quiero hacer un asado para 4",
    items: [
      {
        name: "Carne Asada Premium",
        quantity: "1.5kg",
        price: 12990,
        icon: Drumstick,
      },
      { name: "Pan Familiar", quantity: "2x", price: 3990, icon: Croissant },
      { name: "Cerveza Pack 6", quantity: "1x", price: 6990, icon: Package },
      { name: "Papas 2kg", quantity: "1x", price: 1990, icon: Carrot },
    ],
  },
  {
    supermarket: "Lider",
    accent: "blue",
    prompt: "Necesito hacer la compra semanal",
    items: [
      { name: "Leche Entera 1L", quantity: "3x", price: 1290, icon: Droplet },
      { name: "Pan de Molde", quantity: "2x", price: 1990, icon: Croissant },
      { name: "Huevos Docena", quantity: "1x", price: 4200, icon: CircleDot },
      { name: "Arroz Grado 1 1kg", quantity: "2x", price: 1290, icon: Package },
    ],
  },
  {
    supermarket: "Unimarc",
    accent: "red",
    prompt: "Quiero preparar una once para 6 personas",
    items: [
      { name: "Pan Integral", quantity: "2x", price: 2490, icon: Croissant },
      { name: "Mantequilla 250g", quantity: "1x", price: 1990, icon: Package },
      { name: "Café Molido 500g", quantity: "1x", price: 4990, icon: Coffee },
      { name: "Queso Gouda 250g", quantity: "1x", price: 3990, icon: Package },
      {
        name: "Mermelada 340g",
        quantity: "1x",
        price: 1490,
        icon: UtensilsCrossed,
      },
    ],
  },
]

interface UseCartSimulationOptions {
  typingDuration?: number // ms
  processingDuration?: number // ms
  holdDuration?: number // ms
  transitionDuration?: number // ms
}

export function useCartSimulation(options: UseCartSimulationOptions = {}) {
  const {
    typingDuration = 2500,
    processingDuration = 1500,
    holdDuration = 4000,
    transitionDuration = 500,
  } = options

  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>("TYPING")
  const [typedPrompt, setTypedPrompt] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Helper to parse quantity string (e.g., "2x" -> 2, "1.5kg" -> 1.5)
  const parseQuantity = (quantityStr: string): number => {
    const match = quantityStr.match(/^(\d+\.?\d*)/)
    return match ? parseFloat(match[1]) : 1
  }

  const currentScenario = useMemo(
    () => scenarios[currentScenarioIndex],
    [currentScenarioIndex]
  )
  const totalPrice = useMemo(
    () =>
      currentScenario.items.reduce(
        (sum, item) => sum + item.price * parseQuantity(item.quantity),
        0
      ),
    [currentScenario]
  )

  const timersRef = useRef<NodeJS.Timeout[]>([])

  const clearAllTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current = []
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      clearAllTimers()
    }
  }, [])

  useEffect(() => {
    clearAllTimers()

    if (phase === "TYPING") {
      setTypedPrompt("")
      const prompt = currentScenario.prompt
      const chars = prompt.split("")
      let currentIndex = 0

      const typeChar = () => {
        if (currentIndex < chars.length) {
          setTypedPrompt(prompt.slice(0, currentIndex + 1))
          currentIndex++
          const timer = setTimeout(typeChar, typingDuration / chars.length)
          timersRef.current.push(timer)
        } else {
          // Typing complete, move to processing
          const timer = setTimeout(() => {
            setPhase("PROCESSING")
          }, 300) // Small pause after typing
          timersRef.current.push(timer)
        }
      }

      const timer = setTimeout(typeChar, 100) // Initial delay
      timersRef.current.push(timer)
    } else if (phase === "PROCESSING") {
      const timer = setTimeout(() => {
        setPhase("SHOW_CART")
      }, processingDuration)
      timersRef.current.push(timer)
    } else if (phase === "SHOW_CART") {
      // Cart is shown, total will animate via useAnimatedCounter
      // Move to HOLD after a brief moment
      const timer = setTimeout(() => {
        setPhase("HOLD")
      }, 500) // Give time for cart to appear
      timersRef.current.push(timer)
    } else if (phase === "HOLD") {
      const timer = setTimeout(() => {
        setPhase("TRANSITION")
      }, holdDuration)
      timersRef.current.push(timer)
    } else if (phase === "TRANSITION") {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        // Move to next scenario
        setCurrentScenarioIndex((prev) => (prev + 1) % scenarios.length)
        setPhase("TYPING")
        setIsTransitioning(false)
      }, transitionDuration)
      timersRef.current.push(timer)
    }
  }, [
    phase,
    currentScenario,
    typingDuration,
    processingDuration,
    holdDuration,
    transitionDuration,
  ])

  return {
    currentScenario,
    phase,
    typedPrompt,
    totalPrice,
    isTransitioning,
  }
}
