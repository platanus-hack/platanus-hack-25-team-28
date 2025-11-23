import { authkitMiddleware } from "@workos-inc/authkit-nextjs"

export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [
      "/",
      "/sign-in",
      "/sign-up",
      "/api/jumbo/login",
      "/api/jumbo/add-multiple",
      "/api/jumbo/add-multiple-async",
      "/api/jumbo/open-browser",
      "/api/jumbo/complete-purchase",
      "/pralio",
      "/checkout",
    ],
  },
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
