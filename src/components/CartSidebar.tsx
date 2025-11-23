"use client"

import { CartItem, StoreName } from "@/types"
import { formatCurrency } from "@/utils/cartUtils"
import gsap from "gsap"
import { Minus, Plus, ShoppingCart, X } from "lucide-react"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export interface CartSidebarRef {
  getDestinationRect: (index: number) => DOMRect | null
}

interface CartSidebarProps {
  items?: CartItem[] // Optional with default value
  total: number
  isOpen: boolean // for mobile
  onClose: () => void // for mobile
  onUpdateQuantity?: (sku: string, quantity: number) => void
  activeStore?: StoreName
  onCheckout?: () => void
}

const CartSidebar = forwardRef<CartSidebarRef, CartSidebarProps>(
  (
    {
      items = [],
      total,
      isOpen,
      onClose,
      onUpdateQuantity,
      activeStore = "Lider",
      onCheckout,
    },
    ref
  ) => {
    const listRef = useRef<HTMLDivElement>(null)
    const totalRef = useRef<HTMLSpanElement>(null)
    const [pendingRemoval, setPendingRemoval] = useState<string | null>(null)

    useImperativeHandle(ref, () => ({
      getDestinationRect: (index: number) => {
        if (!listRef.current) return null

        // Find the item element by data attribute (traverse nested category structure)
        const list = listRef.current
        const allElements: HTMLElement[] = []

        // Traverse all children (category sections) and their children (items)
        Array.from(list.children).forEach((categorySection) => {
          Array.from(categorySection.children).forEach((child) => {
            if ((child as HTMLElement).dataset.itemIndex !== undefined) {
              allElements.push(child as HTMLElement)
            }
          })
        })

        const existingItem = allElements[index]

        if (existingItem) {
          return existingItem.getBoundingClientRect()
        }

        // Estimate position for new items
        const listRect = list.getBoundingClientRect()
        // Default to estimated height if children are not yet rendered or array is empty
        const estimatedItemHeight = 74
        const estimatedHeaderHeight = 40
        const gap = 12
        const padding = 16

        // If we have existing children, use the last item to find the next position
        const lastItem = allElements[allElements.length - 1]

        let top = listRect.top + padding
        if (lastItem) {
          const lastItemRect = lastItem.getBoundingClientRect()
          top = lastItemRect.bottom + gap
        } else if (index > 0) {
          // Estimate based on index, accounting for potential category headers
          // Rough estimate: assume one header per 3 items on average
          const estimatedHeaders = Math.ceil(index / 3)
          top =
            listRect.top +
            padding +
            estimatedHeaders * estimatedHeaderHeight +
            index * (estimatedItemHeight + gap)
        }

        // Clamp the vertical position to ensure it doesn't visually overlap the footer/totals area
        const maxTop = listRect.bottom - estimatedItemHeight - 4 // -4 for safety margin
        const clampedTop = Math.min(top, maxTop)

        return {
          top: clampedTop,
          left: listRect.left + padding,
          width: listRect.width - padding * 2,
          height: estimatedItemHeight,
          right: listRect.right - padding,
          bottom: clampedTop + estimatedItemHeight,
          x: listRect.left + padding,
          y: clampedTop,
          toJSON: () => {},
        } as DOMRect
      },
    }))

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

    // Group items by category
    const groupedItems = (() => {
      if (items.length === 0) return {}

      const groups: Record<string, CartItem[]> = {}

      items.forEach((item) => {
        const category =
          item.category && item.category.trim() !== "" ? item.category : "Otros"
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(item)
      })

      return groups
    })()

    // Sort categories alphabetically, with "Otros" at the end
    const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
      if (a === "Otros") return 1
      if (b === "Otros") return -1
      return a.localeCompare(b)
    })

    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

    // Handle quantity change
    const handleQuantityChange = (sku: string, delta: number) => {
      const item = items.find((i) => i.sku === sku)
      if (!item || !onUpdateQuantity) return

      const newQuantity = item.quantity + delta

      if (newQuantity <= 0) {
        // Show confirmation for removal
        setPendingRemoval(sku)
      } else {
        onUpdateQuantity(sku, newQuantity)
      }
    }

    // Confirm removal
    const confirmRemoval = () => {
      if (pendingRemoval && onUpdateQuantity) {
        onUpdateQuantity(pendingRemoval, 0)
        setPendingRemoval(null)
      }
    }

    // Cancel removal
    const cancelRemoval = () => {
      setPendingRemoval(null)
    }

    return (
      <>
        {/* Mobile Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={onClose}
        />

        {/* Sidebar Container */}
        <div
          className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:mr-0 lg:h-full lg:w-full lg:transform-none lg:rounded-none lg:border-l lg:border-gray-200 lg:shadow-none ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"} `}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-white p-6 lg:rounded-t-3xl">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-text-main">
                Carro mágico
                <span className="rounded-full bg-accent-primary/10 px-2 py-1 text-xs text-accent-primary">
                  {totalQuantity}
                </span>
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                Esta es una simulación usando productos reales de {activeStore}.
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
            className="scrollbar-hide min-h-0 flex-1 overflow-y-auto p-4"
            ref={listRef}
          >
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-text-muted opacity-50">
                <ShoppingCart size={48} className="mb-4" />
                <p>El carro está vacío</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedCategories.map((category) => {
                  const categoryItems = groupedItems[category]
                  let flatIndex = 0
                  // Calculate the starting flat index for this category
                  sortedCategories.forEach((cat) => {
                    if (cat === category) return
                    flatIndex += groupedItems[cat].length
                  })

                  return (
                    <div key={category} className="space-y-3">
                      {/* Category Header */}
                      <div className="relative -mx-2 mt-6 first:mt-0">
                        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50/80 to-white/50 px-4 py-3 backdrop-blur-sm">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-primary/5 to-transparent" />
                          <div className="relative flex items-center gap-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300/60 to-gray-300/60" />
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-accent-primary/20 blur-sm" />
                                <div className="relative rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-primary/8 p-1.5 ring-1 ring-accent-primary/10">
                                  <div className="h-1.5 w-1.5 rounded-full bg-accent-primary shadow-sm" />
                                </div>
                              </div>
                              <h3 className="text-xs font-bold tracking-[0.15em] text-text-main uppercase">
                                {category}
                              </h3>
                              <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-accent-primary/20 blur-sm" />
                                <div className="relative rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-primary/8 p-1.5 ring-1 ring-accent-primary/10">
                                  <div className="h-1.5 w-1.5 rounded-full bg-accent-primary shadow-sm" />
                                </div>
                              </div>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-gray-300/60 via-gray-300/60 to-transparent" />
                          </div>
                        </div>
                      </div>

                      {/* Category Items */}
                      {categoryItems.map((item, categoryItemIndex) => {
                        const currentFlatIndex = flatIndex + categoryItemIndex
                        const isPendingRemoval = pendingRemoval === item.sku

                        return (
                          <div
                            key={`${item.sku}-${currentFlatIndex}`}
                            data-item-index={currentFlatIndex}
                            className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all ${
                              isPendingRemoval
                                ? "border-red-200 bg-red-50"
                                : "border-transparent hover:border-gray-100 hover:bg-gray-50"
                            }`}
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
                              <div className="mt-1 flex items-center gap-2">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(item.sku, -1)
                                    }
                                    disabled={isPendingRemoval}
                                    className="flex h-7 w-7 items-center justify-center rounded-l-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="min-w-[2rem] text-center text-sm font-medium text-text-main">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(item.sku, 1)
                                    }
                                    disabled={isPendingRemoval}
                                    className="flex h-7 w-7 items-center justify-center rounded-r-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-text-main">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {formatCurrency(item.price)} c/u
                              </span>
                            </div>

                            {/* Removal Confirmation */}
                            {isPendingRemoval && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-xl bg-red-50/95 backdrop-blur-sm">
                                <button
                                  onClick={confirmRemoval}
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                                >
                                  Eliminar
                                </button>
                                <button
                                  onClick={cancelRemoval}
                                  className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer / Totals */}
          <div className="relative border-t border-gray-100 bg-gray-50 p-6 lg:rounded-b-3xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-text-muted">Productos</span>
              <span className="font-semibold">{totalQuantity}</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-text-muted">Envío estimado</span>
              <span className="font-medium text-accent-success">Gratis</span>
            </div>
            <div className="flex items-end justify-between border-t border-gray-200 pt-4">
              <span className="text-lg font-bold text-text-main">
                Total estimado
              </span>
              <span
                ref={totalRef}
                className="text-3xl font-bold text-text-main"
              >
                {formatCurrency(total)}
              </span>
            </div>
            <div className="mt-4 text-center text-[10px] text-gray-400">
              Precios de referencia · {activeStore} · Demo sin compra real
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (onCheckout && items.length > 0) {
                    await onCheckout()
                  }
                }}
                disabled={!onCheckout || items.length === 0}
                className="w-full rounded-xl bg-black py-3.5 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                Ir a pagar
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }
)

CartSidebar.displayName = "CartSidebar"

export default CartSidebar
