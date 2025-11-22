'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageSquare, Cpu, ShoppingBasket } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);

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
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    {
      icon: <MessageSquare className="w-8 h-8 text-accent-primary" />,
      title: "Escribes lo que necesitas",
      desc: 'Usas lenguaje natural: "Asado para 6", "Limpieza mensual", "Desayunos saludables para la semana", etc.'
    },
    {
      icon: <Cpu className="w-8 h-8 text-purple-600" />,
      title: "La IA entiende tu intención",
      desc: "Nuestro modelo de IA transforma tu texto en una lista optimizada de productos, cantidades y presupuesto."
    },
    {
      icon: <ShoppingBasket className="w-8 h-8 text-accent-success" />,
      title: "Llenamos tu carro",
      desc: "Te mostramos un carro listo para comprar, con productos reales de Lider optimizados para tu bolsillo."
    }
  ];

  return (
    <section id="como-funciona" ref={sectionRef} className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-text-main mb-4">Cómo funciona esta demo</h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Simplificamos la experiencia de compra usando tecnología avanzada para entender exactamente lo que buscas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="how-card bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-text-main mb-3">{step.title}</h3>
              <p className="text-text-muted leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
