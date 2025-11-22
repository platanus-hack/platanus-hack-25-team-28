"use client";

import { Sparkles, ShoppingCart, Zap } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-bg-elevated">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-text-main mb-16">
          Cómo funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="text-accent-primary" size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-main">1. Describe tu necesidad</h3>
            <p className="text-text-muted">
              Escribe en lenguaje natural lo que necesitas comprar
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Zap className="text-accent-primary" size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-main">2. IA selecciona productos</h3>
            <p className="text-text-muted">
              Nuestra IA analiza y selecciona los mejores productos para ti
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart className="text-accent-primary" size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-main">3. Revisa y compra</h3>
            <p className="text-text-muted">
              Revisa tu carro inteligente y completa tu compra
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

