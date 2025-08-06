"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { 
  Home, 
  HelpCircle, 
  HeadphonesIcon, 
  Settings,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
}

const sidebarItems = [
  {
    title: "Home",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "How to use",
    icon: HelpCircle,
    href: "/dashboard/how-to-use",
  },
  {
    title: "Support",
    icon: HeadphonesIcon,
    href: "/dashboard/support",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex h-full w-64 flex-col bg-card border-r border-border",
      className
    )}>      
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 hover:bg-primary/5 hover:text-primary group",
                isActive && "bg-primary/10 text-primary shadow-sm"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
              <span className="flex-1">{item.title}</span>
              {isActive && (
                <ChevronRight className="h-4 w-4 text-primary" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
