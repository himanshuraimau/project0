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
import { CreditStatus } from "@/components/ui/credit-status"

import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarCollapseTrigger,
  useSidebar
} from "@/components/ui/sidebar"

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

interface AppSidebarProps {
  className?: string
}

export function Sidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()
  const { open } = useSidebar()

  return (
    <UISidebar className={cn("z-10", className)}>
      <SidebarHeader className="flex justify-between items-center">
        <div className="flex items-center">
          {open && <span className="font-semibold">Dashboard</span>}
        </div>
        <SidebarCollapseTrigger />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild
                      active={isActive}
                      className={!open ? "justify-center !px-2" : ""}
                    >
                      <Link href={item.href} className="flex items-center w-full">
                        <Icon className="h-4 w-4" />
                        {open && <span className="ml-3">{item.title}</span>}
                        {isActive && open && (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {open && 
        <SidebarFooter>
          {open && <CreditStatus />}
        </SidebarFooter>
      }
    </UISidebar>
  )
}
