'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight, ShoppingBag } from 'lucide-react';
import gsap from 'gsap';
import { formatCurrency } from '@/utils/cartUtils';

interface HeroProps {
  onFillCart: (prompt: string) => void;
}

export default function Hero({ onFillCart }: HeroProps) {
  const [prompt, setPrompt] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLFormElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Pulse animation
    gsap.to(inputRef.current, {
      scale: 1.02,
      boxShadow: "0 0 20px rgba(37, 99, 235, 0.3)",
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        onFillCart(prompt);
      }
    });
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text Entrance
      gsap.from(".hero-text-element", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out"
      });

      // Card Floating Animation
      gsap.to(cardRef.current, {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      
      // Card Parallax with Mouse
      const handleMouseMove = (e: MouseEvent) => {
        if (!cardRef.current) return;
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth - 0.5) * 20;
        const yPos = (clientY / window.innerHeight - 0.5) * 20;
        
        gsap.to(cardRef.current, {
          rotateY: xPos,
          rotateX: -yPos,
          duration: 1,
          ease: "power2.out"
        });
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-screen flex items-center pt-20 pb-10 px-6 md:px-12 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-success/10 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Content */}
        <div ref={textRef} className="flex flex-col gap-8 z-10">
          <div className="hero-text-element inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-gray-200 w-fit backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-medium text-text-muted">Potenciado con Inteligencia Artificial</span>
          </div>

          <h1 className="hero-text-element text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-text-main">
            Arma tu carro de <br className="hidden md:block" />
            <span className="text-accent-primary">supermercado</span> con <br className="hidden md:block" />
            solo una frase.
          </h1>

          <p className="hero-text-element text-xl text-text-muted max-w-xl leading-relaxed">
            Escribe lo que necesitas — por ejemplo "Quiero armar un asado para 6 personas con 40.000 CLP" — y dejamos que la magia se encargue del resto.
          </p>

          <div className="hero-text-element w-full max-w-lg">
            <form 
              ref={inputRef} 
              onSubmit={handleSubmit}
              className="relative group bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex items-center transition-all duration-300 hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-accent-primary/20"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Quiero armar un carro para un asado para 6 personas..."
                className="flex-1 bg-transparent border-none px-4 py-3 text-lg focus:outline-none placeholder:text-gray-400 text-text-main"
              />
              <button 
                type="submit"
                className="bg-accent-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg active:scale-95 transform duration-100"
              >
                <span className="hidden sm:inline">Llenar carro</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Desayuno rápido", "Limpieza mensual", "Once con amigos"].map((suggestion, i) => (
                <button 
                  key={i}
                  onClick={() => setPrompt(suggestion + "...")}
                  className="text-sm px-3 py-1.5 rounded-full bg-white border border-gray-200 text-text-muted hover:border-accent-primary hover:text-accent-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Floating Card */}
        <div className="hidden lg:flex justify-center perspective-1000">
          <div 
            ref={cardRef} 
            className="w-[380px] bg-white rounded-3xl shadow-2xl p-6 relative border border-gray-100 transform-style-3d"
          >
            {/* Card Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-success/10 rounded-full flex items-center justify-center text-accent-success">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Tu Carro</p>
                  <p className="font-bold text-text-main">Lider Express</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">#8392</span>
            </div>

            {/* Mini Items */}
            <div className="space-y-3 mb-6">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-2 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-end">
                <span className="text-sm text-text-muted">Total estimado</span>
                <span className="text-2xl font-bold text-accent-success">{formatCurrency(42990)}</span>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-accent-warning rounded-2xl rotate-12 shadow-lg flex items-center justify-center text-white font-bold text-xl z-10">
              IA
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
