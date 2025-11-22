"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import SupermarketExperience from "@/components/SupermarketExperience";
import HowItWorks from "@/components/HowItWorks";
import FutureSection from "@/components/FutureSection";
import Footer from "@/components/Footer";
import { LiderProduct } from "@/types";
import { buildMockCart } from "@/utils/cartUtils";
import liderProductsData from "@/data/lider_products.json";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

// Force cast the json data to the type if needed, or just rely on inference
const liderProducts = liderProductsData as unknown as LiderProduct[];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [cart, setCart] = useState<LiderProduct[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleSearch = (userPrompt: string) => {
    setPrompt(userPrompt);
    
    // Build mock cart
    const newCart = buildMockCart(liderProducts);
    
    // Scroll to experience section
    gsap.to(window, {
      duration: 1.5,
      scrollTo: "#experiencia",
      ease: "power4.inOut",
      onComplete: () => {
        // Start "Adding" animation after scroll
        setCart(newCart);
        setIsAdding(true);
      }
    });
  };

  const handleAnimationComplete = () => {
    setIsAdding(false);
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Hero onSearch={handleSearch} />
      
      <SupermarketExperience 
        products={liderProducts}
        cart={cart}
        prompt={prompt}
        isAdding={isAdding}
        onAnimationComplete={handleAnimationComplete}
      />
      
      <HowItWorks />
      
      <FutureSection />
      
      <Footer />
    </main>
  );
}