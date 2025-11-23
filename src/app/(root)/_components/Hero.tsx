"use client"

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import gsap from "gsap"
import { ArrowRight, Loader2, Mic, Sparkles } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import HeroCartPreview from "./HeroCartPreview"

interface HeroProps {
  onFillCart: (prompt: string) => void
  isLoading?: boolean
}

export default function Hero({ onFillCart, isLoading = false }: HeroProps) {
  const [prompt, setPrompt] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLFormElement>(null)

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
      const timer = setTimeout(() => {
        setPrompt(transcript)
      }, 0)
      return () => clearTimeout(timer)
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
        <HeroCartPreview />
      </div>
    </section>
  )
}
