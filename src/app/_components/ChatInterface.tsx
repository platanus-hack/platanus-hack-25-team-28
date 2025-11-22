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
  cartItems,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
    setMessages([userMsg])
    setIsTyping(true)

    // Simulate AI thinking and response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `¡Excelente elección! Para "${initialPrompt}", he preparado una selección de productos recomendados. He agregado los esenciales a tu carro. ¿Te gustaría ajustar algo o agregar algún detalle específico?`,
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 2000)
  }, [initialPrompt])

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
      {/* Header */}
      <div className="mb-6 text-center">
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

      {/* Messages Area */}
      <div className="scrollbar-hide mb-6 flex-1 space-y-6 overflow-y-auto pr-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative">
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
