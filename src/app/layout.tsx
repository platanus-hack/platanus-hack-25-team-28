import { ConvexClientProvider } from "@/components/ConvexClientProvider"
import SmoothScroll from "@/components/SmoothScroll"
import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SuperTracker - Tu compra de supermercado en segundos",
  description:
    "Pide tus compras sin pensar en segundos. Powered by AI (Demo).",
  icons: {
    icon: [
      { url: "/images/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/images/favicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="antialiased">
      <body
        className={`${inter.variable} ${robotoMono.variable} overflow-x-hidden bg-bg-page font-sans text-text-main`}
      >
        <ConvexClientProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
