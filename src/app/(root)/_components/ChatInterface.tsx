"use client"

import { CartItem } from "@/types"
import { Sparkles } from "lucide-react"
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
  const [messages, setMessages] = useState<Message[]>([])
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

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4 md:p-6">
      {/* Scrollable Container wrapping Header + Messages */}
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex-1 space-y-6 overflow-y-auto pr-2"
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
    </div>
  )
}
