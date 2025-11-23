"use client"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Image from "next/image"
import { useEffect, useRef } from "react"
import NavBarAuth from "./NavBarAuth"

gsap.registerPlugin(ScrollTrigger)

export default function NavBar() {
  const navRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const nav = navRef.current
    const logo = logoRef.current

    if (!nav || !logo) return

    // Update CSS variable with navbar height
    const updateNavbarHeight = () => {
      const height = nav.getBoundingClientRect().height
      document.documentElement.style.setProperty("--navbar-height", `${height}px`)
    }

    // Initial State
    gsap.set(nav, {
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      paddingTop: "1rem",
      paddingBottom: "1rem",
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(4px)",
      onComplete: updateNavbarHeight,
    })

    // Update height on scroll/resize
    updateNavbarHeight()
    window.addEventListener("resize", updateNavbarHeight)

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
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(4px)",
        borderBottom: "0px solid transparent",
        onUpdate: updateNavbarHeight,
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

    return () => {
      window.removeEventListener("resize", updateNavbarHeight)
    }
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
      className="fixed top-0 right-0 left-0 z-50 border-b border-transparent px-6 transition-colors duration-300 md:px-12"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(4px)",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div
          ref={logoRef}
          className="flex cursor-pointer items-center gap-2"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
            <Image
              src="/images/logo.png"
              alt="SuperTracker Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-main">
            SuperTracker
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollToSection("precios")}
            className="text-sm font-medium text-text-muted transition-colors hover:text-text-main"
          >
            Precios
          </button>
          <button
            onClick={() => scrollToSection("recursos")}
            className="text-sm font-medium text-text-muted transition-colors hover:text-text-main"
          >
            Recursos
          </button>
          <button
            onClick={() => scrollToSection("comunidad")}
            className="text-sm font-medium text-text-muted transition-colors hover:text-text-main"
          >
            Comunidad
          </button>
        </div>
        <NavBarAuth />
      </div>
    </nav>
  )
}
