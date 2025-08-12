"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { 
  Home, 
  HelpCircle, 
  HeadphonesIcon, 
  Settings,
  ChevronRight,
  PanelLeftClose,
  PanelLeft
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
  collapsed?: boolean
  onToggle?: () => void
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

export function Sidebar({ className, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex h-full flex-col bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex justify-end p-2">
        <button 
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-primary/10 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5 text-muted-foreground" />
          ) : (
            <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-2">
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
              title={collapsed ? item.title : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
              {!collapsed && (
                <span className="flex-1">{item.title}</span>
              )}
              {!collapsed && isActive && (
                <ChevronRight className="h-4 w-4 text-primary" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
