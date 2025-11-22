import clsx from "clsx"
import { User, Bot } from "lucide-react"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={clsx(
        "animate-in fade-in slide-in-from-bottom-2 flex gap-4 duration-300",
        message.role === "user" ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          message.role === "user"
            ? "bg-gray-200 text-gray-600"
            : "bg-accent-primary text-white"
        )}
      >
        {message.role === "user" ? <User size={20} /> : <Bot size={20} />}
      </div>

      {/* Bubble */}
      <div
        className={clsx(
          "max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm md:text-base",
          message.role === "user"
            ? "rounded-tr-sm border border-gray-200 bg-white text-text-main"
            : "rounded-tl-sm border border-gray-200 bg-white text-text-main"
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
