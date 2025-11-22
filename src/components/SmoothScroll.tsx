"use client"

import { ReactNode, useEffect } from "react"

interface SmoothScrollProps {
  children: ReactNode
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    // We disable global smooth scroll because we are using GSAP for controlled scrolling.
    // CSS scroll-behavior: smooth often conflicts with GSAP ScrollToPlugin.
    document.documentElement.style.scrollBehavior = "smooth"

    return () => {
      document.documentElement.style.scrollBehavior = "auto"
    }
  }, [])

  return <>{children}</>
}
