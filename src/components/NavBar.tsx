"use client";

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-text-main">Carrito IA</h1>
        </div>
        <div className="text-sm text-text-muted">
          Demo Técnica
        </div>
      </div>
    </nav>
  );
}

