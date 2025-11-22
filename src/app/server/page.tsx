import { api } from "@/src/convex/_generated/api"
import { preloadQuery, preloadedQueryResult } from "convex/nextjs"
import Image from "next/image"
import Home from "./inner"

export default async function ServerPage() {
  const preloaded = await preloadQuery(api.myFunctions.listNumbers, {
    count: 3,
  })

  const data = preloadedQueryResult(preloaded)

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-4">
          <Image src="/convex.svg" alt="Convex Logo" width={48} height={48} />
          <div className="h-12 w-px bg-slate-300 dark:bg-slate-600"></div>
          <Image
            src="/nextjs-icon-light-background.svg"
            alt="Next.js Logo"
            width={48}
            height={48}
            className="dark:hidden"
          />
          <Image
            src="/nextjs-icon-dark-background.svg"
            alt="Next.js Logo"
            width={48}
            height={48}
            className="hidden dark:block"
          />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200">
          Convex + Next.js
        </h1>
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-slate-300 bg-slate-100 p-6 shadow-md dark:border-slate-600 dark:bg-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Non-reactive server-loaded data
        </h2>
        <code className="overflow-x-auto rounded-lg border border-slate-300 bg-white p-4 dark:border-slate-600 dark:bg-slate-900">
          <pre className="text-sm text-slate-700 dark:text-slate-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        </code>
      </div>
      <Home preloaded={preloaded} />
    </main>
  )
}
