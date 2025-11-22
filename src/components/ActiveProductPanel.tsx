"use client";

import { LiderProduct } from "@/types";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Sparkles, Info, Check } from "lucide-react";
import clsx from "clsx";

interface ActiveProductPanelProps {
  product: LiderProduct | null;
  isInCart: boolean;
}

export default function ActiveProductPanel({ product, isInCart }: ActiveProductPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  // Animations when product changes
  useEffect(() => {
    if (!product || !containerRef.current) return;

    const tl = gsap.timeline();

    // Fade out/slide out slightly
    tl.fromTo(
      [nameRef.current, priceRef.current],
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }
    );

    // Price counter animation effect
    if (priceRef.current) {
      const startPrice = product.price * 0.8;
      gsap.fromTo(
        priceRef.current,
        { innerText: startPrice },
        {
          innerText: product.price,
          duration: 0.6,
          snap: { innerText: 10 }, // Snap to integers
          onUpdate: function () {
            if (priceRef.current) {
              priceRef.current.innerText = `$${Math.ceil(Number(this.targets()[0].innerText)).toLocaleString("es-CL")}`;
            }
          },
        }
      );
    }
  }, [product]);

  if (!product) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted/30">
        <p>Explora el pasillo...</p>
      </div>
    );
  }

  // Mock "Smart" context based on category
  const getSmartContext = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes("carne") || lower.includes("asado")) return "Ideal para la parrilla del fin de semana.";
    if (lower.includes("bebida") || lower.includes("cerveza")) return "Formato conveniente para compartir.";
    if (lower.includes("limpieza")) return "Esencial para el aseo profundo.";
    if (lower.includes("lacteo") || lower.includes("desayuno")) return "Perfecto para empezar el día.";
    return "Seleccionado especialmente para ti.";
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col justify-center p-8">
      {/* Smart Tag */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold uppercase tracking-wide">
          <Sparkles size={12} />
          Recomendado IA
        </span>
        {isInCart && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-success/10 text-accent-success text-xs font-bold uppercase tracking-wide animate-in fade-in zoom-in duration-300">
            <Check size={12} />
            En tu carro
          </span>
        )}
      </div>

      {/* Product Name */}
      <h2
        ref={nameRef}
        className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-main leading-[1.1] mb-6 tracking-tight"
      >
        {product.name}
      </h2>

      {/* Price & Meta */}
      <div className="space-y-6">
        <div className="flex items-baseline gap-4">
          <span ref={priceRef} className="text-4xl font-bold text-text-main tracking-tighter">
            ${product.price.toLocaleString("es-CL")}
          </span>
          <span className="text-lg text-text-muted line-through opacity-60">
            ${(product.price * 1.2).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Context Info */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex gap-4 items-start max-w-md">
          <div className="p-2 bg-gray-50 rounded-full shrink-0 text-text-muted">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-main mb-1">¿Por qué este producto?</h4>
            <p className="text-sm text-text-muted leading-relaxed">
              {getSmartContext(product.category)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

