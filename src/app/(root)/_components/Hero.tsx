"use client"

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { formatCurrency } from "@/utils/cartUtils"
import gsap from "gsap"
import { ArrowRight, Loader2, Mic, ShoppingBag, Sparkles } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

interface HeroProps {
  onFillCart: (prompt: string) => void
  isLoading?: boolean
}

export default function Hero({ onFillCart, isLoading = false }: HeroProps) {
  const [prompt, setPrompt] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLFormElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const {
    isListening,
    isSupported,
    error: speechError,
    transcript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language: "es-ES",
    onResult: (text) => {
      setPrompt(text)
    },
  })

  useEffect(() => {
    if (transcript) {
      setPrompt(transcript)
    }
  }, [transcript])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return

    // Pulse animation
    gsap.to(inputRef.current, {
      scale: 1.02,
      boxShadow: "0 0 20px rgba(37, 99, 235, 0.3)",
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        onFillCart(prompt)
      },
    })
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text Entrance
      gsap.from(".hero-text-element", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      })

      // Card Floating Animation
      gsap.to(cardRef.current, {
        y: -15,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })

      // Card Parallax with Mouse - Enhanced to follow cursor
      const handleMouseMove = (e: MouseEvent) => {
        if (!cardRef.current) return
        const { clientX, clientY } = e
        const xPos = (clientX / window.innerWidth - 0.5) * 12
        const yPos = (clientY / window.innerHeight - 0.5) * 12

        gsap.to(cardRef.current, {
          rotateY: xPos,
          rotateX: -yPos,
          transformPerspective: 1000,
          duration: 0.4,
          ease: "power2.out",
        })
      }

      window.addEventListener("mousemove", handleMouseMove)
      return () => window.removeEventListener("mousemove", handleMouseMove)
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen items-center overflow-hidden px-6 pt-20 pb-10 md:px-12"
    >
      {/* Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-accent-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-accent-success/10 blur-[100px]" />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left Column: Content */}
        <div ref={textRef} className="z-10 flex flex-col gap-4">
          <div className="hero-text-element inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white/50 px-3 py-1 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-accent-primary" />
            <span className="text-sm font-medium text-text-muted">
              Potenciado con Inteligencia Artificial
            </span>
          </div>

          <div className="hero-text-element inline-block rounded-2xl bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm">
            <h1 className="text-5xl leading-[1.1] font-bold tracking-tight text-text-main md:text-7xl">
              Arma tu carro de <br className="hidden md:block" />
              <span className="text-accent-primary">supermercado</span> con{" "}
              <br className="hidden md:block" />
              solo una frase.
            </h1>
          </div>

          <div className="hero-text-element inline-block max-w-xl rounded-2xl bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm">
            <p className="text-xl leading-relaxed text-text-muted">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              Escribe lo que necesitas — por ejemplo "Quiero armar un asado para
              6 personas con 40.000 CLP&quot; — y dejamos que la magia se
              encargue del resto.
            </p>
          </div>

          <div className="hero-text-element w-full max-w-lg">
            <form
              ref={inputRef}
              onSubmit={handleSubmit}
              className="group relative flex items-center rounded-2xl border border-gray-100 bg-white p-2 shadow-lg transition-all duration-300 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-accent-primary/20 hover:shadow-xl"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Quiero armar un carro para un asado para 6 personas..."
                className="flex-1 border-none bg-transparent px-4 py-3 pr-12 text-lg text-text-main placeholder:text-gray-400 focus:outline-none"
                disabled={isLoading}
              />
              <div className="flex items-center gap-2">
                {isSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        stopListening()
                      } else {
                        startListening()
                      }
                    }}
                    disabled={isLoading}
                    className={`rounded-lg p-2 transition-colors ${
                      isListening
                        ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
                        : "text-gray-500 hover:bg-gray-100"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title={
                      isListening
                        ? "Detener grabación"
                        : "Iniciar grabación de voz"
                    }
                  >
                    <Mic size={20} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex min-w-[140px] transform items-center justify-center gap-2 rounded-xl bg-accent-primary px-6 py-3 font-semibold text-white shadow-md transition-colors duration-100 hover:bg-blue-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="hidden sm:inline">Pensando...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Llenar carro</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
            {speechError && (
              <p className="mt-2 text-xs text-red-500">{speechError}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {["Desayuno rápido", "Limpieza mensual", "Once con amigos"].map(
                (suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(suggestion + "...")}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-accent-primary hover:text-accent-primary"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Floating Card */}
        <div
          className="hidden justify-center lg:flex"
          style={{ perspective: "1000px" }}
        >
          <div
            ref={cardRef}
            className="relative w-[380px] rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Card Header */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-success/10 text-accent-success">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                    Tu Carro
                  </p>
                  <p className="font-bold text-text-main">Jumbo</p>
                </div>
              </div>
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500">
                #8392
              </span>
            </div>

            {/* Mini Items */}
            <div className="mb-6 space-y-3">
              {[
                {
                  name: "Pan Molde Ideal",
                  quantity: "2x",
                  price: "$3.990",
                  emoji: "🍞",
                },
                {
                  name: "Leche Entera 1L",
                  quantity: "3x",
                  price: "$2.490",
                  emoji: "🥛",
                },
                {
                  name: "Huevos Docena",
                  quantity: "1x",
                  price: "$4.200",
                  emoji: "🥚",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                    {item.emoji}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium text-text-main">
                      {item.name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-text-main">
                    {item.price}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-100 pt-2">
              <div className="flex items-end justify-between">
                <span className="text-sm text-text-muted">Total estimado</span>
                <span className="text-2xl font-bold text-accent-success">
                  {formatCurrency(10680)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
