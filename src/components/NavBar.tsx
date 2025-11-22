"use client"

import React, { useEffect, useRef } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

import { ShoppingBasket } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NavBar() {
  const navRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const nav = navRef.current
    const logo = logoRef.current

    if (!nav || !logo) return

    // Initial State
    gsap.set(nav, {
      boxShadow: "0px 0px 0px rgba(0,0,0,0)",
      paddingTop: "1.5rem",
      paddingBottom: "1.5rem",
      backgroundColor: "rgba(245, 245, 247, 0)",
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top -50",
        end: "top -100",
        scrub: 0.5,
      },
    })

    tl.to(
      nav,
      {
        paddingTop: "0.75rem",
        paddingBottom: "0.75rem",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
      },
      0
    ).to(
      logo,
      {
        scale: 0.9,
        transformOrigin: "left center",
      },
      0
    )
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav
      ref={navRef}
      className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 transition-colors duration-300 md:px-12"
    >
      <div
        ref={logoRef}
        className="flex cursor-pointer items-center gap-2"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary text-white">
          <ShoppingCart size={18} strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold tracking-tight text-text-main">
          carrito IA
        </span>
      </div>

      <div className="hidden items-center gap-8 md:flex">
        <button
          onClick={() => scrollToSection("experiencia")}
          className="text-sm font-medium text-text-muted transition-colors hover:text-text-main"
        >
          Experiencia
        </button>
        <button
          onClick={() => scrollToSection("como-funciona")}
          className="text-sm font-medium text-text-muted transition-colors hover:text-text-main"
        >
          Cómo funciona
        </button>
        <button
          onClick={() => scrollToSection("futuro-ia")}
          className="text-sm font-medium text-text-muted transition-colors hover:text-text-main"
        >
          Futuro IA
        </button>
      </div>

      <div className="hidden md:flex">
        <div className="rounded-full border border-accent-primary/30 bg-accent-primary/5 px-3 py-1 text-xs font-semibold tracking-wide text-accent-primary">
          Próximamente: IA que optimiza tu compra
        </div>
      </div>
    </nav>
  )
}
