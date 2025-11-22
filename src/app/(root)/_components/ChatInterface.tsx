"use client"

import { CartItem } from "@/types"
import { Send, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ChatMessage, Message } from "./chat/ChatMessage"
import { TypingIndicator } from "./chat/TypingIndicator"

interface ChatInterfaceProps {
  initialPrompt: string
  cartItems?: CartItem[]
}

export default function ChatInterface({
  initialPrompt,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cartItems,
}: ChatInterfaceProps) {
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
            behavior: "smooth"
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
    const total = cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
    const itemCount = cartItems?.length || 0

    // Simulate AI thinking and response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `¡He terminado! He agregado ${itemCount} productos a tu carro con un total estimado de $${total.toLocaleString("es-CL")}. ¿Te gustaría ajustar las cantidades o buscar algo más?`,
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 1000)
  }, [initialPrompt, cartItems])

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

    // Simple echo/mock response for follow-up
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Entendido. He actualizado tus recomendaciones basándome en eso. ¿Necesitas algo más?",
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4 md:p-6">
      {/* Scrollable Container wrapping Header + Messages */}
      <div 
        ref={scrollContainerRef}
        className="scrollbar-hide mb-6 flex-1 space-y-6 overflow-y-auto pr-2"
      >
        {/* Header - Now inside scrollable area */}
        <div className="text-center pt-2 pb-2">
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
