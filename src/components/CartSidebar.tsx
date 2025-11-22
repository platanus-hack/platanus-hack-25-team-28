'use client';

import React, { useEffect, useRef } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { CartItem, formatCurrency } from '@/utils/cartUtils';
import gsap from 'gsap';

interface CartSidebarProps {
  items: CartItem[];
  total: number;
  isOpen: boolean; // for mobile
  onClose: () => void; // for mobile
}

export default function CartSidebar({ items, total, isOpen, onClose }: CartSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLSpanElement>(null);

  // Animate new items
  useEffect(() => {
    if (listRef.current) {
      gsap.from(listRef.current.children, {
        opacity: 0,
        y: 20,
        stagger: 0.05,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  }, [items]); // Re-run when items change (or valid subset)

  // Animate total change
  useEffect(() => {
    if (totalRef.current) {
      gsap.fromTo(totalRef.current, 
        { scale: 1.2, color: "#22C55E" },
        { scale: 1, color: "#22C55E", duration: 0.3, clearProps: "scale" }
      );
    }
  }, [total]);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:transform-none lg:relative lg:w-full lg:h-[80vh] lg:rounded-3xl lg:shadow-xl lg:border lg:border-gray-100 flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white lg:rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              Carro mágico
              <span className="bg-accent-primary/10 text-accent-primary text-xs px-2 py-1 rounded-full">{items.length}</span>
            </h2>
            <p className="text-xs text-text-muted mt-1">Esta es una simulación usando productos reales de Lider.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full lg:hidden">
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={listRef}>
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
              <ShoppingCart size={48} className="mb-4" />
              <p>El carro está vacío</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.sku}-${index}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg overflow-hidden flex-shrink-0 p-1">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">{item.name}</p>
                  <p className="text-xs text-text-muted">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-text-main">{formatCurrency(item.price)}</p>
                  <span className="text-[10px] text-gray-400">x1</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Totals */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 lg:rounded-b-3xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-muted">Productos</span>
            <span className="font-semibold">{items.length}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-muted">Envío estimado</span>
            <span className="text-accent-success font-medium">Gratis</span>
          </div>
          <div className="flex justify-between items-end pt-4 border-t border-gray-200">
            <span className="text-lg font-bold text-text-main">Total estimado</span>
            <span ref={totalRef} className="text-3xl font-bold text-text-main">{formatCurrency(total)}</span>
          </div>
          <div className="mt-4 text-[10px] text-center text-gray-400">
            Precios de referencia · Solo Lider · Demo sin compra real
          </div>
          <button className="w-full mt-4 bg-black text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200">
            Ir a pagar (Demo)
          </button>
        </div>
      </div>
    </>
  );
}
