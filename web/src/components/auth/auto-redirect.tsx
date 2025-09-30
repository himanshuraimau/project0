"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AutoRedirectProps {
  redirectTo?: string
  children: React.ReactNode
}

export function AutoRedirect({ redirectTo = "/dashboard", children }: AutoRedirectProps) {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if auth is loaded and user is authenticated
    if (isLoaded && userId) {
      // Add a small delay to prevent jarring redirects
      const timer = setTimeout(() => {
        router.push(redirectTo)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isLoaded, userId, redirectTo, router])

  // Show children while auth is loading or user is not authenticated
  return <>{children}</>
}
