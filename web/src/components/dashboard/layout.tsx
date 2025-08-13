"use client"

import React from "react"
import { cn } from "@/lib/utils"

// This component is deprecated and should no longer be used
// We're keeping a simplified version for backward compatibility
// Please use the app/dashboard/layout.tsx instead

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  // This is now a passthrough component to avoid breaking existing code
  // The real layout is handled by app/dashboard/layout.tsx
  return (
    <>
      {children}
    </>
  )
}
