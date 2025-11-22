"use client"

import React, { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Play, TrendingUp, ChefHat } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

export default function FutureSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax cards
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      gsap.utils.toArray(".future-card").forEach((card: any, i) => {
        gsap.from(card, {
          y: 100,
          opacity: 0,
          duration: 1,
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
        })
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="futuro-ia"
      ref={containerRef}
      className="relative overflow-hidden bg-gray-900 px-6 py-24 text-white md:px-12"
    >
      {/* Background Elements */}
      <div className="absolute top-0 left-0 z-0 h-full w-full overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] h-[800px] w-[800px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-16">
          <span className="text-sm font-semibold tracking-wider text-accent-primary uppercase">
            Roadmap
          </span>
          <h2 className="mt-2 text-4xl font-bold md:text-6xl">
            Lo que viene después
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Card 1: Budget Optimization */}
          <div className="future-card group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-colors duration-500 hover:bg-white/10 md:p-12">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 transition-transform duration-300 group-hover:scale-110">
              <TrendingUp size={28} />
            </div>
            <h3 className="mb-4 text-2xl font-bold md:text-3xl">
              IA que optimiza tu presupuesto
            </h3>
            <p className="mb-8 text-lg leading-relaxed text-gray-400">
              No solo llena el carro, sino que ajusta cantidades, marcas y
              formatos para que tu compra total se adapte a tu presupuesto
              límite sin que pierdas calidad.
            </p>
            <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-gray-800 to-gray-900">
              {/* Mock Graph UI */}
              <div className="absolute bottom-0 left-0 flex h-2/3 w-full items-end justify-around px-4 pb-4">
                {[40, 70, 45, 90, 60, 75].map((h, i) => (
                  <div
                    key={i}
                    className="w-8 rounded-t-md bg-blue-500/50"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: AI Video Recipes */}
          <div className="future-card group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-colors duration-500 hover:bg-white/10 md:p-12">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 transition-transform duration-300 group-hover:scale-110">
              <ChefHat size={28} />
            </div>
            <h3 className="mb-4 text-2xl font-bold md:text-3xl">
              Videos generados por IA
            </h3>
            <p className="mb-8 text-lg leading-relaxed text-gray-400">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              Imagina escribir "asado para 10" y recibir un video corto con los
              pasos, tiempos y productos exactos que ya están en tu carro.
            </p>
            <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/5 bg-black transition-shadow group-hover:shadow-2xl">
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-colors hover:bg-white/30">
                  <Play size={24} fill="white" className="ml-1" />
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80"
                alt="Cooking Preview"
                className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
