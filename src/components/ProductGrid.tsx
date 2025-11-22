"use client"

import { ProductCard } from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"

export function ProductGrid() {
  const products = useQuery(api.products.list)

  if (products === undefined) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[250px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-slate-50 text-center dark:bg-slate-900">
        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
          No products found.
        </p>
        <p className="text-sm text-slate-500">
          Run the seed mutation to generate data.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          bestPrice={product.bestPrice ? Number(product.bestPrice) : undefined}
        />
      ))}
    </div>
  )
}
