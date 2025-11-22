"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface HeroProps {
  onSearch: (prompt: string) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
      setInput("");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-bg-page to-bg-elevated px-6 py-20">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-text-main leading-tight">
            Tu compra de supermercado
            <br />
            <span className="text-accent-primary">en segundos</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-muted max-w-2xl mx-auto">
            Arma tu carro con solo una frase. Powered by AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex gap-3 items-center bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ej: Asado para 6 personas..."
                className="w-full px-4 py-4 text-lg border-0 outline-0 text-text-main placeholder:text-text-muted"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-accent-primary text-white rounded-xl font-semibold hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
            >
              <Sparkles size={20} />
              Buscar
            </button>
          </div>
        </form>

        <p className="text-sm text-text-muted">
          Ejemplos: "Desayuno saludable", "Cena romántica", "Limpieza del hogar"
        </p>
      </div>
    </section>
  );
}

