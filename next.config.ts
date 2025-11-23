import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "unimarc.vtexassets.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "jumbocl.vteximg.com.br",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i5.walmartimages.cl",
        port: "",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
