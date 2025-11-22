"use client"

import { api } from "@/convex/_generated/api"
import { useAction, useMutation, useQuery } from "convex/react"
import { Id } from "@/convex/_generated/dataModel"
import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"

export function ConversationView() {
  const [sessionId, setSessionId] =
    useState<Id<"conversation_sessions"> | null>(null)
  const [initialTopic, setInitialTopic] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const createSession = useMutation(api.myFunctions.createConversationSession)
  const processMessage = useAction(api.myFunctions.processConversationMessage)
  const removeFromCart = useMutation(api.myFunctions.removeFromCart)
  const updateCartItem = useMutation(api.myFunctions.updateCartItem)

  const session = useQuery(
    api.myFunctions.getConversationSession,
    sessionId ? { sessionId } : "skip"
  )
  const cart = useQuery(
    api.myFunctions.getCart,
    sessionId ? { sessionId } : "skip"
  )

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

  const handleUpdateQuantity = async (
    productId: Id<"products">,
    newQuantity: number
  ) => {
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
      <div className="mx-auto w-full max-w-2xl p-6">
        <Card className="p-8">
          <h1 className="mb-4 text-3xl font-bold">Shopping Assistant</h1>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Let&apos;s have a conversation about what you need. I&apos;ll help
            you find the perfect products and can adjust recommendations based
            on your feedback.
          </p>

          <form onSubmit={handleStartConversation} className="space-y-4">
            <div>
              <label htmlFor="topic" className="mb-2 block text-sm font-medium">
                What are you shopping for today?
              </label>
              <input
                id="topic"
                type="text"
                value={initialTopic}
                onChange={(e) => setInitialTopic(e.target.value)}
                placeholder="e.g., I'm planning a BBQ for 15 people"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={!initialTopic.trim()}
              className="w-full"
            >
              Start Conversation
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-screen max-w-7xl gap-4 p-4">
      {/* Shopping Cart - Left Side */}
      <Card className="flex w-80 flex-col border-r">
        <div className="sticky top-0 z-10 border-b bg-white p-4 dark:bg-slate-900">
          <h2 className="text-lg font-bold">🛒 Shopping Cart</h2>
          <p className="mt-1 text-xs text-slate-500">
            {cart?.items?.length || 0} items
          </p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!cart || cart.items.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">Your cart is empty</p>
              <p className="mt-2 text-xs">Start chatting to add items!</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.productId}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {item.productName}
                    </h4>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {item.category}
                    </p>
                    {item.brand && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.brand}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-2 flex items-center justify-between">
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
                    className="flex-shrink-0 text-slate-400 transition-colors hover:text-red-500"
                    title="Remove from cart"
                  >
                    ✕
                  </button>
                </div>

                {/* Quantity Control */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(
                        item.productId,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                    className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
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
                    className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
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
          <div className="sticky bottom-0 border-t bg-slate-50 p-4 dark:bg-slate-800">
            <div className="mb-3 flex items-center justify-between">
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
      <Card className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <h2 className="text-lg font-bold">{session?.topic}</h2>
          <p className="text-sm text-slate-500">
            Satisfaction:{" "}
            {"⭐".repeat(Math.round((session?.satisfactionLevel || 5) / 2))}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {session?.messages && session.messages.length > 0 ? (
            session.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.analysis && (
                    <p className="mt-1 text-xs opacity-70">
                      Intent: {message.analysis.intent} • Sentiment:{" "}
                      {message.analysis.sentiment}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-500">
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
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <Button type="submit" disabled={isLoading || !messageInput.trim()}>
              {isLoading ? "..." : "Send"}
            </Button>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            Try: &quot;I need cheaper options&quot; or &quot;Add 2 more
            beers&quot; or &quot;Remove the drinks&quot;
          </p>
        </div>
      </Card>
    </div>
  )
}
