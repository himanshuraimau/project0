"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AutoRedirectProps {
  redirectTo?: string
  children: React.ReactNode
}

export function AutoRedirect({ redirectTo = "/dashboard", children }: AutoRedirectProps) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if auth is loaded and user is authenticated
    if (!isPending && session?.user) {
      // Add a small delay to prevent jarring redirects
      const timer = setTimeout(() => {
        router.push(redirectTo)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isPending, session, redirectTo, router])

  // Show children while auth is loading or user is not authenticated
  return <>{children}</>
}
