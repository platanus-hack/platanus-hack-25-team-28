import CartSidebar, { CartSidebarRef } from "@/components/CartSidebar"
import { CartItem, StoreName } from "@/types"
import clsx from "clsx"
import StoreTabs from "./StoreTabs"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  activeStore: StoreName
  onStoreChange: (store: StoreName) => void
  sidebarRef?: React.RefObject<CartSidebarRef | null>
  className?: string
  onUpdateQuantity?: (sku: string, quantity: number) => void
  liderCartCount: number
  unimarcCartCount: number
  jumboCartCount: number
  onCheckout?: () => void
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  activeStore,
  onStoreChange,
  sidebarRef,
  className,
  onUpdateQuantity,
  liderCartCount,
  unimarcCartCount,
  jumboCartCount,
  onCheckout,
}: CartDrawerProps) {
  return (
    <div
      className={clsx(
        "z-30 h-[100dvh] overflow-hidden border-l border-gray-200 bg-white shadow-2xl transition-all duration-500 ease-in-out",
        // Mobile: Fixed overlay. Desktop: Controlled by parent via className or defaults
        "fixed top-0 right-0 bottom-0 lg:static",
        isOpen
          ? "w-[85vw] translate-x-0 lg:w-[350px] lg:translate-x-0"
          : "w-[85vw] translate-x-full lg:w-0 lg:translate-x-0 lg:border-none",
        className
      )}
    >
      <div className="relative flex h-full w-full flex-col">
        {/* Store Tabs */}
        <StoreTabs
          activeStore={activeStore}
          onStoreChange={onStoreChange}
          liderCartCount={liderCartCount}
          unimarcCartCount={unimarcCartCount}
          jumboCartCount={jumboCartCount}
        />

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className={clsx(
            "absolute top-4 right-4 z-50 rounded-full bg-white p-2 text-text-main shadow-md hover:bg-gray-100 lg:hidden",
            !isOpen && "hidden"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="flex-1 overflow-hidden">
          <CartSidebar
            items={cart}
            total={cart.reduce(
              (acc, item) => acc + item.price * item.quantity,
              0
            )}
            isOpen={isOpen}
            onClose={onClose}
            ref={sidebarRef}
            onUpdateQuantity={onUpdateQuantity}
            activeStore={activeStore}
            onCheckout={onCheckout}
          />
        </div>
      </div>
    </div>
  )
}
