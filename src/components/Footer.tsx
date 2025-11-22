import React from "react"

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text-main">carrito IA</span>
        </div>

        <div className="text-center text-sm text-text-muted md:text-right">
          <p className="mb-2">
            Demo creada para hackathon · Datos de ejemplo de Lider · Sin
            afiliación oficial
          </p>
          <a
            href="#"
            className="text-gray-400 transition-colors hover:text-text-main"
          >
            Política de privacidad
          </a>
        </div>
      </div>
    </footer>
  )
}
