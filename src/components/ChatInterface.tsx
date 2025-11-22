"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, User, Bot } from "lucide-react";
import clsx from "clsx";
import { CartItem } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  initialPrompt: string;
  cartItems?: CartItem[];
}

export default function ChatInterface({
  initialPrompt,
  cartItems,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initial interaction
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Add user's initial prompt
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: initialPrompt,
    };
    setMessages([userMsg]);
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `¡Excelente elección! Para "${initialPrompt}", he preparado una selección de productos recomendados. He agregado los esenciales a tu carro. ¿Te gustaría ajustar algo o agregar algún detalle específico?`,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 2000);
  }, [initialPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simple echo/mock response for follow-up
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entendido. He actualizado tus recomendaciones basándome en eso. ¿Necesitas algo más?",
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-primary/10 text-accent-primary mb-3">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-bold text-text-main">Asistente de Compras</h2>
        <p className="text-text-muted text-sm">Diseñando tu experiencia de supermercado</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* Avatar */}
            <div
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user"
                  ? "bg-gray-200 text-gray-600"
                  : "bg-accent-primary text-white"
              )}
            >
              {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Bubble */}
            <div
              className={clsx(
                "max-w-[80%] p-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-white border border-gray-200 text-text-main rounded-tr-sm"
                  : "bg-white border border-gray-200 text-text-main rounded-tl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4 flex-row animate-in fade-in duration-300">
             <div className="w-10 h-10 rounded-full bg-accent-primary text-white flex items-center justify-center shrink-0">
                <Bot size={20} />
             </div>
             <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-accent-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-accent-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="w-full p-4 pr-12 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

