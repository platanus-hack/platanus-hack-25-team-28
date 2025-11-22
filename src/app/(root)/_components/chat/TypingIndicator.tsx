import { Bot } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="animate-in fade-in flex flex-row gap-4 duration-300">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary text-white">
        <Bot size={20} />
      </div>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-gray-200 bg-white p-4 shadow-sm">
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-accent-primary/50"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-accent-primary/50"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-accent-primary/50"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  )
}
