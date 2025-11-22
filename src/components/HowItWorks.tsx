"use client"

import React, { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MessageSquare, Cpu, ShoppingBasket } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".how-card", {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const steps = [
    {
      icon: <MessageSquare className="h-8 w-8 text-accent-primary" />,
      title: "Escribes lo que necesitas",
      desc: 'Usas lenguaje natural: "Asado para 6", "Limpieza mensual", "Desayunos saludables para la semana", etc.',
    },
    {
      icon: <Cpu className="h-8 w-8 text-purple-600" />,
      title: "La IA entiende tu intención",
      desc: "Nuestro modelo de IA transforma tu texto en una lista optimizada de productos, cantidades y presupuesto.",
    },
    {
      icon: <ShoppingBasket className="h-8 w-8 text-accent-success" />,
      title: "Llenamos tu carro",
      desc: "Te mostramos un carro listo para comprar, con productos reales de Lider optimizados para tu bolsillo.",
    },
  ]

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="bg-white px-6 py-24 md:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-text-main md:text-5xl">
            Cómo funciona esta demo
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-text-muted">
            Simplificamos la experiencia de compra usando tecnología avanzada
            para entender exactamente lo que buscas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="how-card rounded-3xl border border-gray-100 bg-gray-50 p-8 transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                {step.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold text-text-main">
                {step.title}
              </h3>
              <p className="leading-relaxed text-text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
