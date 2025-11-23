"use client"

import {
  AuthKitProvider,
  useAccessToken,
  useAuth,
} from "@workos-inc/authkit-nextjs/components"
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react"
import { ReactNode, useCallback, useEffect, useRef } from "react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  )
}

function useAuthFromAuthKit() {
  const { user, loading: isLoading } = useAuth()
  const {
    accessToken,
    loading: tokenLoading,
    error: tokenError,
  } = useAccessToken()
  const loading = (isLoading ?? false) || (tokenLoading ?? false)
  const authenticated = !!user && !!accessToken && !loading

  const stableAccessToken = useRef<string | null>(null)

  // Update ref in useEffect to avoid updating during render
  useEffect(() => {
    if (accessToken && !tokenError) {
      stableAccessToken.current = accessToken
    }
  }, [accessToken, tokenError])

  const fetchAccessToken = useCallback(async () => {
    if (stableAccessToken.current && !tokenError) {
      return stableAccessToken.current
    }
    return null
  }, [tokenError])

  return {
    isLoading: loading,
    isAuthenticated: authenticated,
    fetchAccessToken,
  }
}
