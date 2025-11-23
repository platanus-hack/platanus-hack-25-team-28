"use client"

import { StoreName } from "@/types"
import clsx from "clsx"

interface StoreTabsProps {
  activeStore: StoreName
  onStoreChange: (store: StoreName) => void
  liderCartCount: number
  unimarcCartCount: number
  jumboCartCount: number
}

export default function StoreTabs({
  activeStore,
  onStoreChange,
  liderCartCount,
  unimarcCartCount,
  jumboCartCount,
}: StoreTabsProps) {
  const stores: Array<{ name: StoreName; label: string; count: number }> = [
    { name: "Lider", label: "Lider", count: liderCartCount },
    { name: "Unimarc", label: "Unimarc", count: unimarcCartCount },
    { name: "Jumbo", label: "Jumbo", count: jumboCartCount },
  ]

  return (
    <div className="flex border-b border-gray-200 bg-white">
      {stores.map((store) => {
        const isActive = activeStore === store.name
        let activeColorClass = "text-accent-primary"
        let activeBgClass = "bg-accent-primary/10 text-accent-primary"
        let activeBorderClass = "bg-accent-primary"

        if (store.name === "Lider") {
          activeColorClass = "text-blue-600"
          activeBgClass = "bg-blue-50 text-blue-600"
          activeBorderClass = "bg-blue-600"
        } else if (store.name === "Jumbo") {
          activeColorClass = "text-green-600"
          activeBgClass = "bg-green-50 text-green-600"
          activeBorderClass = "bg-green-600"
        } else if (store.name === "Unimarc") {
          activeColorClass = "text-red-600"
          activeBgClass = "bg-red-50 text-red-600"
          activeBorderClass = "bg-red-600"
        }

        return (
          <button
            key={store.name}
            onClick={() => onStoreChange(store.name)}
            className={clsx(
              "relative flex-1 px-4 py-3 text-sm font-medium transition-all duration-200",
              "hover:bg-gray-50 focus:ring-2 focus:ring-accent-primary focus:outline-none focus:ring-inset",
              isActive
                ? activeColorClass
                : "text-text-muted hover:text-text-main"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <span>{store.label}</span>
              {store.count > 0 && (
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    isActive ? activeBgClass : "bg-gray-100 text-gray-600"
                  )}
                >
                  {store.count}
                </span>
              )}
            </div>
            {/* Active indicator */}
            {isActive && (
              <div
                className={clsx(
                  "absolute right-0 bottom-0 left-0 h-0.5",
                  activeBorderClass
                )}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
