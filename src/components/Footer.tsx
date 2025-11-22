import React from "react"

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-100 bg-white px-6 py-4 md:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-main">carrito IA</span>
        </div>

        <div className="text-right text-xs text-text-muted">
          <p className="inline-block mr-4">
            Hackathon Demo
          </p>
          <a
            href="#"
            className="text-gray-400 transition-colors hover:text-text-main"
          >
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  )
}
