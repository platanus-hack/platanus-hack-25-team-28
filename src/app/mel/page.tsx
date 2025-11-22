"use client"

import { ProductGrid } from "@/components/ProductGrid"
import Image from "next/image"

export default function Home() {
  return (
    <>
      <header className="bg-background/80 sticky top-0 z-10 flex flex-row items-center justify-between border-b border-slate-200 p-4 shadow-sm backdrop-blur-md dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Image src="/convex.svg" alt="Convex Logo" width={32} height={32} />
            <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
            <Image
              src="/nextjs-icon-light-background.svg"
              alt="Next.js Logo"
              width={32}
              height={32}
              className="dark:hidden"
            />
            <Image
              src="/nextjs-icon-dark-background.svg"
              alt="Next.js Logo"
              width={32}
              height={32}
              className="hidden dark:block"
            />
          </div>
          <h1 className="font-semibold text-slate-800 dark:text-slate-200">
            SuperTracker
          </h1>
        </div>
      </header>
      <main className="flex flex-col gap-8 p-8">
        <ProductGrid />
      </main>
    </>
  )
}
