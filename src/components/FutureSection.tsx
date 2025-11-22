'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, TrendingUp, ChefHat } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function FutureSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax cards
      gsap.utils.toArray('.future-card').forEach((card: any, i) => {
        gsap.from(card, {
          y: 100,
          opacity: 0,
          duration: 1,
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          }
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="futuro-ia" ref={containerRef} className="py-24 px-6 md:px-12 bg-gray-900 text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-16">
          <span className="text-accent-primary font-semibold tracking-wider uppercase text-sm">Roadmap</span>
          <h2 className="text-4xl md:text-6xl font-bold mt-2">Lo que viene después</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Budget Optimization */}
          <div className="future-card group bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 hover:bg-white/10 transition-colors duration-500">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={28} />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">IA que optimiza tu presupuesto</h3>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              No solo llena el carro, sino que ajusta cantidades, marcas y formatos para que tu compra total se adapte a tu presupuesto límite sin que pierdas calidad.
            </p>
            <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/5 relative overflow-hidden">
               {/* Mock Graph UI */}
               <div className="absolute bottom-0 left-0 w-full h-2/3 flex items-end justify-around px-4 pb-4">
                 {[40, 70, 45, 90, 60, 75].map((h, i) => (
                   <div key={i} className="w-8 bg-blue-500/50 rounded-t-md" style={{ height: `${h}%` }} />
                 ))}
               </div>
            </div>
          </div>

          {/* Card 2: AI Video Recipes */}
          <div className="future-card group bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 hover:bg-white/10 transition-colors duration-500">
             <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-8 group-hover:scale-110 transition-transform duration-300">
               <ChefHat size={28} />
             </div>
             <h3 className="text-2xl md:text-3xl font-bold mb-4">Videos generados por IA</h3>
             <p className="text-gray-400 text-lg leading-relaxed mb-8">
               Imagina escribir "asado para 10" y recibir un video corto con los pasos, tiempos y productos exactos que ya están en tu carro.
             </p>
             <div className="w-full h-48 bg-black rounded-2xl border border-white/5 relative overflow-hidden group-hover:shadow-2xl transition-shadow">
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                    <Play size={24} fill="white" className="ml-1" />
                  </div>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" 
                  alt="Cooking Preview" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                />
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
