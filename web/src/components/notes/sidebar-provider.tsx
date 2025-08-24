"use client"

import React from "react"
import { SidebarProvider as UISidebarProvider, useSidebar } from "@/components/ui/sidebar"

interface NotesSidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  sidebarWidth?: string
  sidebarWidthMobile?: string
}

export function NotesSidebarProvider({
  children,
  defaultOpen = true,
  sidebarWidth = "240px",
  sidebarWidthMobile = "240px"
}: NotesSidebarProviderProps) {
  return (
    <UISidebarProvider 
      defaultOpen={defaultOpen} 
      style={{
        "--sidebar-width": sidebarWidth,
        "--sidebar-width-mobile": sidebarWidthMobile
      } as Record<string, string>}
    >
      {children}
    </UISidebarProvider>
  )
}

export function NotesSidebarContent({
  children,
  className,
  sidebarWidth = "240px",
  collapsedWidth = "4rem"
}: {
  children: React.ReactNode
  className?: string
  sidebarWidth?: string
  collapsedWidth?: string
}) {
  // Use the imported useSidebar hook
  const { open } = useSidebar();

  return (
    <main 
      className={`flex flex-col w-full transition-all duration-300 ${className || ''}`}
      style={{
        marginLeft: open ? sidebarWidth : collapsedWidth,
        width: `calc(100% - ${open ? sidebarWidth : collapsedWidth})`,
      }}
    >
      {children}
    </main>
  )
}
