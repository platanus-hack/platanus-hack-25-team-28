'use client';

import React, { useState, useEffect } from 'react';
import { CartItem } from '@/types';
import SupermarketTrack from './SupermarketTrack';
import CartSidebar from './CartSidebar';

interface SupermarketExperienceProps {
  prompt: string;
  targetCart: CartItem[];
  isFilling: boolean;
  onFillingComplete: () => void;
}

export default function SupermarketExperience({ 
  prompt, 
  targetCart, 
  isFilling, 
  onFillingComplete 
}: SupermarketExperienceProps) {
  const [displayItems, setDisplayItems] = useState<CartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Reset display items when a new filling process starts
  useEffect(() => {
    if (isFilling) {
      setDisplayItems([]);
    }
  }, [isFilling, targetCart]);

  const handleItemAdded = (item: CartItem) => {
    setDisplayItems(prev => {
      // Check if item already exists (simple dedupe logic if needed, though buildMockCart should return unique-ish items)
      return [item, ...prev];
    });
  };

  const total = displayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section id="experiencia" className="relative py-12 px-4 md:px-8 max-w-8xl mx-auto min-h-screen flex flex-col">
      
      {/* Header / Hint */}
      <div className="mb-8 text-center md:text-left space-y-2">
        {prompt ? (
          <div className="inline-block px-4 py-2 bg-accent-primary/5 border border-accent-primary/10 rounded-full text-accent-primary font-medium text-sm mb-2">
            Entendimos: "{prompt}"
          </div>
        ) : (
          <div className="inline-block px-4 py-2 bg-gray-100 rounded-full text-text-muted font-medium text-sm mb-2">
            Empieza escribiendo tu lista arriba
          </div>
        )}
        <h2 className="text-3xl md:text-4xl font-bold text-text-main">
          Así se arma tu carro en tiempo real.
        </h2>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Main Stage: Supermarket Track */}
        <div className="flex-1 relative z-10">
          <SupermarketTrack 
            isAddingItems={isFilling}
            productsToAnimate={targetCart}
            onItemAdded={handleItemAdded}
            onSequenceComplete={onFillingComplete}
          />
        </div>

        {/* Sidebar (Desktop) / Bottom Sheet (Mobile) */}
        <div className="lg:w-1/3 relative z-20">
           <CartSidebar 
             items={displayItems} 
             total={total} 
             isOpen={isMobileCartOpen}
             onClose={() => setIsMobileCartOpen(false)}
           />
           
           {/* Mobile Trigger for Cart */}
           <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30 bg-text-main text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center cursor-pointer active:scale-95 transition-transform"
                onClick={() => setIsMobileCartOpen(true)}>
             <div className="flex flex-col">
               <span className="text-xs text-gray-400">{displayItems.length} productos</span>
               <span className="font-bold">${total.toLocaleString('es-CL')}</span>
             </div>
             <div className="bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold">
               Ver carro
             </div>
           </div>
        </div>
      </div>
    </section>
  );
}

