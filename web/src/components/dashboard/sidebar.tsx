"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  HelpCircle,
  HeadphonesIcon,
  Settings,
  BookOpen,
  Zap,
  Menu,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "600"],
  subsets: ["latin-ext", "vietnamese"],
});

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const sidebarItems = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  { title: "Create Course", icon: BookOpen, href: "/dashboard/generate-course" },
  { title: "How to use", icon: HelpCircle, href: "/dashboard/how-to-use" },
  { title: "Support", icon: HeadphonesIcon, href: "/dashboard/support" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Sidebar
      className={cn(
        "border-r h-screen bg-white dark:border-stone-800 dark:bg-stone-950 transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[280px]",
        className
      )}
    >
      {/* Sidebar Header */}
      <SidebarHeader className="border-b py-6 border-stone-200 dark:border-stone-800">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="flex items-center justify-center size-7 rounded-lg bg-stone-900 dark:bg-stone-100">
              <Zap className="size-4 text-stone-50 dark:text-stone-900" />
            </div>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <Menu className="size-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-7 rounded-lg bg-stone-900 dark:bg-stone-100">
                <Zap className="size-4 text-stone-50 dark:text-stone-900" />
              </div>
              <span
                className={`text-xl leading-[32px] font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
              >
                SonicLearn
              </span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
          </div>
        )}
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="flex-1 pt-2 px-2">
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
                      isActive={isActive}
                      className={cn(
                        "flex items-center gap-3 rounded-lg transition-colors",
                        // Even tighter spacing for collapsed mode
                        isCollapsed ? "justify-center w-12 h-12 my-0.1" : "px-3 py-2 my-2",
                        isActive
                          ? "bg-yellow-500 text-white"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      )}
                    >
                      <Link href={item.href} className="flex items-center w-full gap-3">
                        <Icon className="size-[22px] flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="leading-[24px] font-normal">{item.title}</span>
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

      {/* Sidebar Footer */}
      <SidebarFooter className="mt-auto w-full px-3 py-4 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
        <div
          className={cn(
            "mx-auto flex items-center gap-3 px-4 py-2 rounded-lg shadow-sm transition-colors duration-200",
            "bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800"
          )}
        >
          <span className="text-stone-600 text-2xl dark:text-stone-400">⚡</span>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Unlimited Notes
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
