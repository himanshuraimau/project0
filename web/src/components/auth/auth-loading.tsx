"use client"

import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

interface AuthLoadingWrapperProps {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
}

export function AuthLoadingWrapper({ children, loadingComponent }: AuthLoadingWrapperProps) {
  const { isPending } = useSession()

  if (isPending) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
