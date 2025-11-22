"use client";

import { LiderProduct } from "@/types";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import clsx from "clsx";
import { Check } from "lucide-react";

interface CartSidebarProps {
  cart: LiderProduct[];
  total: number;
  activeProductSku?: string; // New prop
}

export default function CartSidebar({ cart, total, activeProductSku }: CartSidebarProps) {
  const totalRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevTotal = useRef(0);

  // Animate total change
  useEffect(() => {
    if (!totalRef.current) return;
    
    const start = prevTotal.current;
    const end = total;
    
    gsap.to({ val: start }, {
      val: end,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: function () {
        if (totalRef.current) {
          totalRef.current.innerText = `$${Math.round(this.targets()[0].val).toLocaleString("es-CL")}`;
        }
      },
    });

    prevTotal.current = total;
  }, [total]);

  // Auto-scroll to active item
  useEffect(() => {
     if (activeProductSku && listRef.current) {
         const activeEl = document.getElementById(`cart-item-${activeProductSku}`);
         if (activeEl) {
             activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
         }
     }
  }, [activeProductSku]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="p-6 border-b border-gray-200 bg-gray-50/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Tu Carro</span>
        </div>
        <h2 className="text-xl font-bold text-text-main">Lista Inteligente</h2>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-text-muted opacity-50 p-4">
            <p className="text-sm">Tu carro está vacío</p>
          </div>
        ) : (
            cart.map((item, index) => {
                const isActive = item.sku === activeProductSku;
                return (
                    <div 
                        key={`${item.sku}-${index}`} 
                        id={`cart-item-${item.sku}`}
                        className={clsx(
                            "flex gap-3 items-center p-3 rounded-xl transition-all duration-300",
                            isActive ? "bg-white shadow-md scale-[1.02] border-l-4 border-accent-primary" : "bg-white/50 hover:bg-white hover:shadow-sm"
                        )}
                    >
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-white overflow-hidden border border-gray-100 p-1">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={clsx("text-xs font-medium truncate", isActive ? "text-accent-primary" : "text-text-main")}>
                                {item.name}
                            </h3>
                            <p className="text-xs text-text-muted">${item.price.toLocaleString("es-CL")}</p>
                        </div>
                        {isActive && <Check size={14} className="text-accent-primary shrink-0" />}
                    </div>
                );
            })
        )}
      </div>

      <div className="p-6 bg-white border-t border-gray-200 sticky bottom-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end mb-1">
          <span className="text-xs text-text-muted font-medium uppercase tracking-wide">Total Estimado</span>
        </div>
        <div className="flex justify-between items-center">
          <span ref={totalRef} className="text-2xl font-bold text-text-main tracking-tight">
            $0
          </span>
          <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-text-muted">
              {cart.length} items
          </span>
        </div>
      </div>
    </div>
  );
}
