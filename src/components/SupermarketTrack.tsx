"use client";

import { LiderProduct } from "@/types";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import clsx from "clsx";

interface SupermarketTrackProps {
  products: LiderProduct[];
  activeIndex: number;
}

export default function SupermarketTrack({ products, activeIndex }: SupermarketTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Handle active product focus animations
  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      const isActive = index === activeIndex;
      
      // Use GSAP for smooth transition between states
      gsap.to(card, {
        scale: isActive ? 1.15 : 0.9,
        opacity: isActive ? 1 : 0.5,
        filter: isActive ? "blur(0px) brightness(1)" : "blur(2px) brightness(0.9)",
        z: isActive ? 0 : -100, // Push back inactive items
        rotationY: isActive ? 0 : index < activeIndex ? 15 : -15, // Subtle rotation towards center
        boxShadow: isActive 
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(37, 99, 235, 0.1)" 
          : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        duration: 0.6,
        ease: "power3.out",
      });
    });
  }, [activeIndex]);

  return (
    <div className="relative h-full flex items-center">
      {/* The actual track that gets moved by the parent's ScrollTrigger */}
      <div 
        id="track-inner" 
        ref={trackRef} 
        className="flex items-center px-[50vw] gap-12 md:gap-32 will-change-transform"
      >
        {products.map((p, i) => (
          <div
            key={`${p.sku}-${i}`}
            ref={(el) => { cardsRef.current[i] = el; }}
            className={clsx(
              "relative shrink-0 flex flex-col items-center justify-center bg-white rounded-3xl p-8 border border-gray-100",
              "w-[280px] h-[380px] md:w-[350px] md:h-[450px]",
              "transition-colors duration-500",
              // If active, border is slightly blue
              i === activeIndex ? "border-accent-primary/20" : "border-gray-100"
            )}
            style={{
              transformStyle: "preserve-3d",
              perspective: "1000px"
            }}
          >
            {/* Product Image */}
            <div className="w-full h-[60%] flex items-center justify-center mb-6 relative group">
               {/* Glow effect behind image */}
               <div 
                 className={clsx(
                   "absolute inset-0 bg-gradient-radial from-accent-primary/10 to-transparent opacity-0 transition-opacity duration-500 rounded-full blur-xl",
                   i === activeIndex && "opacity-100"
                 )} 
               />
               <img 
                 src={p.imageUrl} 
                 alt={p.name} 
                 className="w-full h-full object-contain drop-shadow-xl relative z-10 mix-blend-multiply"
               />
            </div>

            {/* Minimal Info on Card (Detailed info is in the side panel) */}
            <div className="text-center relative z-10 w-full">
              <div className="bg-gray-50 inline-block px-3 py-1 rounded-full text-xs font-medium text-text-muted mb-2">
                {p.category}
              </div>
              {/* Price pill only visible if NOT active (since active shows big panel) */}
              <div className={clsx(
                  "mt-2 font-bold text-lg transition-opacity duration-300",
                  i === activeIndex ? "opacity-0" : "opacity-60 text-text-muted"
              )}>
                 ${p.price.toLocaleString("es-CL")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
