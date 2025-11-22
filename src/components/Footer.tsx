import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
           <span className="text-lg font-bold text-text-main">carrito IA</span>
        </div>
        
        <div className="text-sm text-text-muted text-center md:text-right">
          <p className="mb-2">Demo creada para hackathon · Datos de ejemplo de Lider · Sin afiliación oficial</p>
          <a href="#" className="text-gray-400 hover:text-text-main transition-colors">Política de privacidad</a>
        </div>
      </div>
    </footer>
  );
}
