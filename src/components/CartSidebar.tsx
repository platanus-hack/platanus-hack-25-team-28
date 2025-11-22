"use client"

import React, { useEffect, useRef } from "react"
import { ShoppingCart, X } from "lucide-react"
import { CartItem } from "@/types"
import { formatCurrency } from "@/utils/cartUtils"
import gsap from "gsap"

interface CartSidebarProps {
  items?: CartItem[] // Optional with default value
  total: number
  isOpen: boolean // for mobile
  onClose: () => void // for mobile
}

export default function CartSidebar({
  items = [],
  total,
  isOpen,
  onClose,
}: CartSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const totalRef = useRef<HTMLSpanElement>(null)

  // Animate new items
  // Removed GSAP animation to ensure visibility reliability
  // useEffect(() => {
  //   if (listRef.current) {
  //     gsap.from(listRef.current.children, {
  //       opacity: 0,
  //       y: 20,
  //       stagger: 0.05,
  //       duration: 0.4,
  //       ease: "power2.out"
  //     });
  //   }
  // }, [items]);

  // Animate total change
  useEffect(() => {
    if (totalRef.current) {
      gsap.fromTo(
        totalRef.current,
        { scale: 1.2, color: "#22C55E" },
        { scale: 1, color: "#22C55E", duration: 0.3, clearProps: "scale" }
      )
    }
  }, [total])

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:h-full lg:w-full lg:transform-none lg:rounded-none lg:border-l lg:border-gray-200 lg:shadow-none ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"} `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white p-6 lg:rounded-t-3xl">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-text-main">
              Carro mágico
              <span className="rounded-full bg-accent-primary/10 px-2 py-1 text-xs text-accent-primary">
                {items.length}
              </span>
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Esta es una simulación usando productos reales de Lider.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
          ref={listRef}
        >
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-text-muted opacity-50">
              <ShoppingCart size={48} className="mb-4" />
              <p>El carro está vacío</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={`${item.sku}-${index}`}
                className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-gray-100 hover:bg-gray-50"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-main">
                    {item.name}
                  </p>
                  <p className="text-xs text-text-muted">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-text-main">
                    {formatCurrency(item.price)}
                  </p>
                  <span className="text-[10px] text-gray-400">x1</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Totals */}
        <div className="border-t border-gray-100 bg-gray-50 p-6 lg:rounded-b-3xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-text-muted">Productos</span>
            <span className="font-semibold">{items.length}</span>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-text-muted">Envío estimado</span>
            <span className="font-medium text-accent-success">Gratis</span>
          </div>
          <div className="flex items-end justify-between border-t border-gray-200 pt-4">
            <span className="text-lg font-bold text-text-main">
              Total estimado
            </span>
            <span ref={totalRef} className="text-3xl font-bold text-text-main">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="mt-4 text-center text-[10px] text-gray-400">
            Precios de referencia · Solo Lider · Demo sin compra real
          </div>
          <button className="mt-4 w-full rounded-xl bg-black py-3.5 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-95">
            Ir a pagar (Demo)
          </button>
        </div>
      </div>
    </>
  )
}
