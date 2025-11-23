"use client"

import { api } from "@/convex/_generated/api"
import { CartItem } from "@/types"
import { useAction } from "convex/react"
import { Send, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ChatMessage, Message } from "./chat/ChatMessage"
import { TypingIndicator } from "./chat/TypingIndicator"

interface ChatInterfaceProps {
  initialPrompt: string
  cartItems?: CartItem[]
  onUpdateCart?: (items: CartItem[]) => void
}

export default function ChatInterface({
  initialPrompt,
  cartItems,
  onUpdateCart,
}: ChatInterfaceProps) {
  const recommendProducts = useAction(api.recommendations.recommendProducts)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Ref for the scrollable container, NOT the end div
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Initial interaction
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Add user's initial prompt
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: initialPrompt,
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([userMsg])
    setIsTyping(true)

    // Calculate total for context
    const total =
      cartItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
    const itemCount = cartItems?.length || 0

    // Simulate AI thinking and response
    // For the initial load, we assume the parent component (page.tsx) already fetched the products
    // so we just show the summary message.


    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `¡He terminado! He agregado ${itemCount} productos a tu carro con un total estimado de $${total.toLocaleString("es-CL")}. ¿Te gustaría ajustar las cantidades o buscar algo más?`,
    }
    setMessages((prev) => [...prev, aiMsg])
    setIsTyping(false)
  }, [initialPrompt, cartItems]) // Only run when these change initially

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    // Call the API
    const history = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    recommendProducts({
      userPrompt: input,
      conversationHistory: history,
    })
      .then((result) => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            result.recommendation || "Aquí tienes los productos recomendados.",
        }
        setMessages((prev) => [...prev, aiMsg])
        setIsTyping(false)

        // Update cart if products were returned
        if (
          result.selectedProducts &&
          result.selectedProducts.length > 0 &&
          onUpdateCart
        ) {
          // Convert to CartItem format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newItems: any = result.selectedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.minPrice || 0,
            quantity: p.quantity || 1,
            image:
              "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop", // Placeholder or fetch real image if available
            category: p.category,
          }))
          // We might want to merge with existing items or replace?
          // For now, let's append or replace based on logic.
          // The prompt might be "add milk", so we should probably append.
          // But if the user says "replace everything", we should replace.
          // The current backend logic returns a list of "selectedProducts" based on the query.
          // It doesn't explicitly say "append" or "replace".
          // Let's assume we append for now, or maybe the user wants to see *only* these products?
          // Given the "SmartShoppingGrid" context, maybe we should just add them.

          // Actually, let's just pass the new items to the parent and let it decide?
          // Or just call onUpdateCart with the new list.
          // Let's append for now.
          onUpdateCart(newItems)
        }
      })
      .catch((err) => {
        console.error("Error fetching recommendations:", err)
        setIsTyping(false)
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu solicitud.",
        }
        setMessages((prev) => [...prev, errorMsg])
      })
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4 md:p-6">
      {/* Scrollable Container wrapping Header + Messages */}
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide mb-6 flex-1 space-y-6 overflow-y-auto pr-2"
      >
        {/* Header - Now inside scrollable area */}
        <div className="pt-2 pb-2 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-bold text-text-main">
            Asistente de Compras
          </h2>
          <p className="text-sm text-text-muted">
            Diseñando tu experiencia de supermercado
          </p>
        </div>

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {/* Input Area - Stays fixed at bottom of flex container */}
      <form onSubmit={handleSubmit} className="relative shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="w-full rounded-xl border border-gray-200 bg-white p-4 pr-12 shadow-sm transition-all outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-accent-primary transition-colors hover:bg-accent-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}
