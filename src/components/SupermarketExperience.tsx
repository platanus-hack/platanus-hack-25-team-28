"use client";

import { LiderProduct } from "@/types";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SupermarketTrack from "./SupermarketTrack";
import ActiveProductPanel from "./ActiveProductPanel";
import CartSidebar from "./CartSidebar";

gsap.registerPlugin(ScrollTrigger);

interface SupermarketExperienceProps {
  products: LiderProduct[];
  cart: LiderProduct[];
  prompt: string;
  isAdding: boolean;
  onAnimationComplete: () => void;
}

export default function SupermarketExperience({
  products,
  cart,
  prompt,
  isAdding,
  onAnimationComplete,
}: SupermarketExperienceProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackWrapperRef = useRef<HTMLDivElement>(null);
  
  // Use a larger subset of products for the aisle to feel "long"
  // We memoize this to ensure index stability
  const [aisleProducts] = useState(() => {
     // Shuffle and take ~20 items for the walk
     return [...products].sort(() => 0.5 - Math.random()).slice(0, 15);
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = aisleProducts[activeIndex] || null;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const trackWrapper = trackWrapperRef.current;
    // Wait for next tick to ensure track-inner exists if necessary, but useLayoutEffect should be fine if rendered
    // However, track-inner is inside child. We need to query selector.
    
    const ctx = gsap.context(() => {
        // Need to query selector AFTER mount. 
        const trackInner = document.getElementById("track-inner");

        if (!section || !trackWrapper || !trackInner) return;

      
      // 1. Horizontal Scroll Logic
      // We scroll the inner track based on how wide it is relative to viewport
      const getScrollAmount = () => {
        const trackWidth = trackInner.scrollWidth;
        const viewportWidth = window.innerWidth;
        return -(trackWidth - viewportWidth);
      };

      const tween = gsap.to(trackInner, {
        x: getScrollAmount,
        ease: "none", // Linear movement linked to scroll
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=400%", // Makes the section 4x screen height (long walk)
        pin: true,
        scrub: 1,
        animation: tween,
        invalidateOnRefresh: true, // Recalculate widths on resize
        onUpdate: (self) => {
          // 2. Calculate Active Index based on progress
          // Map progress (0-1) to index (0 to length-1)
          const totalItems = aisleProducts.length;
          const rawIndex = self.progress * (totalItems - 1);
          const newIndex = Math.round(rawIndex);
          
          setActiveIndex((prev) => {
             if (prev !== newIndex) return newIndex;
             return prev;
          });
        }
      });

    }, section);

    return () => ctx.revert();
  }, [aisleProducts]);

  // Simple "Added" animation effect hook
  useEffect(() => {
      if (isAdding) {
          // Just a simple timeout to clear the state in parent
          // In a real implementation, we'd fly items from their aisle position
          const timer = setTimeout(() => {
              onAnimationComplete();
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [isAdding, onAnimationComplete]);

  const isProductInCart = cart.some(p => p.sku === activeProduct?.sku);

  return (
    <section
      id="experiencia"
      ref={sectionRef}
      className="relative h-screen w-full bg-bg-page overflow-hidden flex flex-col"
    >
      {/* Top Bar: Context & Prompt */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 lg:px-12 flex justify-between items-start pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm max-w-lg pointer-events-auto">
            <p className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-1">
                Tu Misión
            </p>
            <p className="text-text-main font-medium text-lg leading-snug">
                {prompt ? `"${prompt}"` : "Explora el pasillo para inspirarte"}
            </p>
        </div>
      </div>

      {/* Main Layout: Aisle (Left/Center) + Panel (Right Overlay) + Sidebar (Far Right) */}
      <div className="flex-1 flex relative">
        
        {/* Aisle Area */}
        <div ref={trackWrapperRef} className="flex-1 relative h-full overflow-hidden cursor-grab active:cursor-grabbing">
           {/* Background Elements for Depth */}
           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 z-0" /> {/* Floor line */}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-100/50 pointer-events-none z-10" />
           
           <SupermarketTrack products={aisleProducts} activeIndex={activeIndex} />
        </div>

        {/* Active Info Panel (Floating on Desktop, Bottom on Mobile) */}
        <div className="absolute bottom-0 left-0 w-full lg:w-[25%] lg:static lg:h-full bg-white/90 lg:bg-white backdrop-blur-xl lg:backdrop-blur-none border-t lg:border-t-0 lg:border-l border-gray-200 z-30 shadow-2xl lg:shadow-none transition-all duration-500">
            <ActiveProductPanel product={activeProduct} isInCart={isProductInCart} />
        </div>

        {/* Cart Sidebar (Fixed/Sticky on right edge) */}
        <div className="hidden lg:block w-[280px] xl:w-[320px] h-full border-l border-gray-200 bg-gray-50 z-40">
            <CartSidebar 
                cart={cart} 
                total={cart.reduce((acc, item) => acc + item.price, 0)} 
                activeProductSku={activeProduct?.sku} // Pass active SKU for highlighting
            />
        </div>
      </div>

      {/* Mobile Cart Summary (Bottom Fixed) */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
         <button className="bg-text-main text-white p-4 rounded-full shadow-2xl flex items-center gap-2">
             <span className="font-bold">{cart.length} items</span>
             <span className="w-[1px] h-4 bg-white/20" />
             <span>${cart.reduce((acc, item) => acc + item.price, 0).toLocaleString("es-CL")}</span>
         </button>
      </div>
    </section>
  );
}
