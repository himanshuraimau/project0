"use client"

import React from "react"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Navbar } from "@/components/dashboard/navbar"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar()
  const sidebarWidth = "16rem" // Should match SIDEBAR_WIDTH in sidebar.tsx
  const collapsedWidth = "4rem" // Should match the collapsed width in sidebar.tsx
  
  return (
    <div 
      className="min-h-screen transition-all duration-300" 
      style={{ 
        marginLeft: open ? sidebarWidth : collapsedWidth
      }}
    >
      <Navbar />
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar />
      <DashboardContent>
        {children}
      </DashboardContent>
    </SidebarProvider>
  )
}
