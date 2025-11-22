import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import SmoothScroll from "@/components/SmoothScroll";
import NavBar from "@/components/NavBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carrito IA - Tu compra de supermercado en segundos",
  description: "Arma tu carro de supermercado con solo una frase. Powered by AI (Demo).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="antialiased">
      <body
        className={`${inter.variable} ${robotoMono.variable} bg-bg-page text-text-main overflow-x-hidden font-sans`}
      >
        <ConvexClientProvider>
          <SmoothScroll>
            <NavBar />
            {children}
          </SmoothScroll>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
