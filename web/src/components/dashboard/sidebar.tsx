"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  HelpCircle,
  HeadphonesIcon,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditStatus } from "@/components/ui/credit-status";

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
  useSidebar,
} from "@/components/ui/sidebar";

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
];

interface AppSidebarProps {
  className?: string;
}

export function Sidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <UISidebar
      className={cn(
        "z-10",
        // Dark theme background
        "bg-white dark:bg-slate-900",
        // Border styling for dark theme
        "border-r border-gray-200 dark:border-slate-700",
        // Shadow for better depth
        "shadow-sm dark:shadow-slate-900/20",
        // Responsive width handling
        "min-w-0", // Prevents overflow issues
        className
      )}
    >
      <SidebarHeader
        className={cn(
          "flex justify-between items-center",
          // Enhanced padding for better mobile experience
          "p-4 sm:p-6",
          // Dark theme border
          "border-b border-gray-200 dark:border-slate-700"
        )}
      >
        <div className="flex items-center min-w-0">
          {open && (
            <span
              className={cn(
                "font-semibold text-gray-900 dark:text-slate-100",
                // Responsive text sizing
                "text-base sm:text-lg",
                // Prevent text overflow
                "truncate"
              )}
            >
              Dashboard
            </span>
          )}
        </div>
        <SidebarCollapseTrigger
          className={cn(
            "text-gray-600 dark:text-slate-400",
            "hover:text-gray-900 dark:hover:text-slate-100",
            "transition-colors duration-200",
            // Better touch target for mobile
            "p-1.5 sm:p-1"
          )}
        />
      </SidebarHeader>

      <SidebarContent
        className={cn(
          // Enhanced scrolling for mobile
          "overflow-y-auto overflow-x-hidden",
          // Responsive padding
          "px-2 sm:px-4 py-2"
        )}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      active={isActive}
                      className={cn(
                        // Base styling
                        "w-full transition-all duration-200",
                        // Responsive padding and sizing
                        "h-10 sm:h-11",
                        !open
                          ? "justify-center px-2 sm:px-3"
                          : "justify-start px-3 sm:px-4",
                        // Dark theme colors for inactive state
                        "text-gray-700 dark:text-slate-300",
                        "hover:text-gray-900 dark:hover:text-slate-100",
                        "hover:bg-gray-100 dark:hover:bg-slate-800",
                        // Active state styling
                        isActive && [
                          "bg-blue-50 dark:bg-slate-800",
                          "text-blue-700 dark:text-blue-400",
                          "border-r-2 border-blue-600 dark:border-blue-400",
                        ],
                        // Focus states for accessibility
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400",
                        "focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center w-full min-w-0"
                      >
                        <Icon
                          className={cn(
                            "shrink-0",
                            // Responsive icon sizing
                            "h-4 w-4 sm:h-5 sm:w-5",
                            isActive && "text-blue-600 dark:text-blue-400"
                          )}
                        />
                        {open && (
                          <>
                            <span
                              className={cn(
                                "ml-3 truncate",
                                // Responsive text sizing
                                "text-sm sm:text-base",
                                "font-medium"
                              )}
                            >
                              {item.title}
                            </span>
                            {isActive && (
                              <ChevronRight
                                className={cn(
                                  "ml-auto shrink-0",
                                  "h-4 w-4",
                                  "text-blue-600 dark:text-blue-400",
                                  "transition-transform duration-200"
                                )}
                              />
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {open && (
        <SidebarFooter
          className={cn(
            // Enhanced footer styling
            "p-4 sm:p-6",
            "border-t border-gray-200 dark:border-slate-700",
            "bg-gray-50 dark:bg-slate-800/50"
          )}
        >
          <CreditStatus />
        </SidebarFooter>
      )}
    </UISidebar>
  );
}
