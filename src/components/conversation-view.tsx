"use client"

import { api } from "@/convex/_generated/api"
import { useAction, useMutation, useQuery } from "convex/react"
import { Id } from "@/convex/_generated/dataModel"
import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"

export function ConversationView() {
  const [sessionId, setSessionId] = useState<Id<"conversation_sessions"> | null>(null)
  const [initialTopic, setInitialTopic] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const createSession = useMutation(api.myFunctions.createConversationSession)
  const processMessage = useAction(api.myFunctions.processConversationMessage)
  const removeFromCart = useMutation(api.myFunctions.removeFromCart)
  const updateCartItem = useMutation(api.myFunctions.updateCartItem)

  const session = useQuery(api.myFunctions.getConversationSession, sessionId ? { sessionId } : "skip")
  const cart = useQuery(api.myFunctions.getCart, sessionId ? { sessionId } : "skip")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages])

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialTopic.trim()) return

    setIsLoading(true)
    try {
      const { sessionId: newSessionId } = await createSession({
        topic: initialTopic,
      })

      setSessionId(newSessionId as Id<"conversation_sessions">)
      setInitialTopic("")

      await processMessage({
        sessionId: newSessionId as Id<"conversation_sessions">,
        userMessage: initialTopic,
      })
    } catch (error) {
      console.error("Error starting conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !sessionId || isLoading) return

    setIsLoading(true)
    setMessageInput("")

    try {
      await processMessage({
        sessionId,
        userMessage: messageInput,
      })
    } catch (error) {
      console.error("Error processing message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFromCart = async (productId: Id<"products">) => {
    if (!sessionId) return
    try {
      await removeFromCart({
        sessionId,
        productId,
      })
    } catch (error) {
      console.error("Error removing from cart:", error)
    }
  }

  const handleUpdateQuantity = async (productId: Id<"products">, newQuantity: number) => {
    if (!sessionId) return
    try {
      await updateCartItem({
        sessionId,
        productId,
        quantity: newQuantity,
      })
    } catch (error) {
      console.error("Error updating cart item:", error)
    }
  }

  if (!sessionId) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-4">Shopping Assistant</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Let&apos;s have a conversation about what you need. I&apos;ll help you find the perfect products and can adjust recommendations based on your feedback.
          </p>

          <form onSubmit={handleStartConversation} className="space-y-4">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium mb-2">
                What are you shopping for today?
              </label>
              <input
                id="topic"
                type="text"
                value={initialTopic}
                onChange={(e) => setInitialTopic(e.target.value)}
                placeholder="e.g., I'm planning a BBQ for 15 people"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>

            <Button type="submit" disabled={!initialTopic.trim()} className="w-full">
              Start Conversation
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen gap-4 p-4 max-w-7xl mx-auto">
      {/* Shopping Cart - Left Side */}
      <Card className="w-80 flex flex-col border-r">
        <div className="border-b p-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="font-bold text-lg">🛒 Shopping Cart</h2>
          <p className="text-xs text-slate-500 mt-1">
            {cart?.items?.length || 0} items
          </p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!cart || cart.items.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              <p className="text-sm">Your cart is empty</p>
              <p className="text-xs mt-2">Start chatting to add items!</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.productId}
                className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {item.category}
                    </p>
                    {item.brand && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.brand}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        ${(item.pricePerUnit * item.quantity).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500">
                        ${item.pricePerUnit.toFixed(2)} each
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFromCart(item.productId)}
                    className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove from cart"
                  >
                    ✕
                  </button>
                </div>

                {/* Quantity Control */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))
                    }
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.productId, item.quantity + 1)
                    }
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Total */}
        {cart && cart.items.length > 0 && (
          <div className="border-t p-4 bg-slate-50 dark:bg-slate-800 sticky bottom-0">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold">Total:</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                ${cart.totalAmount.toFixed(2)}
              </span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Checkout
            </Button>
          </div>
        )}
      </Card>

      {/* Chat - Right Side */}
      <Card className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <h2 className="font-bold text-lg">{session?.topic}</h2>
          <p className="text-sm text-slate-500">
            Satisfaction: {"⭐".repeat(Math.round((session?.satisfactionLevel || 5) / 2))}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {session?.messages && session.messages.length > 0 ? (
            session.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.analysis && (
                    <p className="text-xs mt-1 opacity-70">
                      Intent: {message.analysis.intent} • Sentiment: {message.analysis.sentiment}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">
              <p>No messages yet. Send your first message to start!</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Tell me what you need or modify the cart..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
            <Button type="submit" disabled={isLoading || !messageInput.trim()}>
              {isLoading ? "..." : "Send"}
            </Button>
          </form>
          <p className="text-xs text-slate-500 mt-2">
            Try: &quot;I need cheaper options&quot; or &quot;Add 2 more beers&quot; or &quot;Remove the drinks&quot;
          </p>
        </div>
      </Card>
    </div>
  )
}
