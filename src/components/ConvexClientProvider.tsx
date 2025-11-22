"use client"

import { ReactNode, useMemo } from "react"
import { ConvexProvider, ConvexReactClient } from "convex/react"

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode
}) {
  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    []
  )

  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
