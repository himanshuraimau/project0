"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  HelpCircle,
  HeadphonesIcon,
  Settings,
  BookOpen,
  Grid3X3,
  Moon,
  ArrowUpRight,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useTheme } from "next-themes";
import { UserControl } from "@/components/shared/user-control";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "600"],
  subsets: ["latin-ext", "vietnamese"],
});

interface AppSidebarProps {
  className?: string;
}

const dashboardItems = [
  { title: "Dashboard", icon: Grid3X3, href: "/dashboard" },
  { title: "Create Course", icon: BookOpen, href: "/dashboard/generate-course"},
  { title: "How to use", icon: HelpCircle, href: "/dashboard/how-to-use" },
  { title: "Support", icon: HeadphonesIcon, href: "/dashboard/support" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isCollapsed = state === "collapsed";
  const [mounted, setMounted] = useState(false);
  const isDark = (resolvedTheme || theme) === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      className={cn("bg-background rounded-sm", className)}
    >
      <SidebarHeader className="px-5 py-6">
        <div className="flex items-center gap-2 w-full group">
          {isCollapsed ? (
            <div className="relative flex items-center w-full justify-center">
              <div>
                <img
                  src="/logo.png"
                  alt="JelliNote AI"
                  className="h-10 w-auto rounded-md transition-opacity duration-200 opacity-100 group-hover:opacity-0 visible group-hover:invisible"
                />
              </div>
              <SidebarTrigger className="absolute opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10 pointer-events-none group-hover:pointer-events-auto" />
            </div>
          ) : (
            <>
              <div>
                <img
                  src="/logo.png"
                  alt="JelliNote AI"
                  className="h-10 w-auto mr-2 rounded-md"
                />
              </div>
              <div className={`text-foreground flex-1 ${jakarta.className}`}>
                <div className="text-lg font-semibold leading-5">
                  JelliNote AI
                </div>
                <div className="text-sm text-muted-foreground font-medium leading-4">
                  Smart Notes
                </div>
              </div>
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 py-4">
        {/* Dashboard Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu
              className={cn(
                "px-2",
                isCollapsed && "flex flex-col items-center"
              )}
            >
              {dashboardItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "flex items-center transition-all px-3",
                        "text-base font-semibold w-full",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center",
                          isCollapsed ? "justify-center w-full" : "w-full"
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="text-base font-semibold truncate">
                            {item.title}
                          </span>
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

      <SidebarFooter className="mx-4 mb-4">
        {/* Theme Toggle */}
        {!isCollapsed && (
          <div>
            <button
              onClick={() => {
                const newTheme = isDark ? "light" : "dark";
                setTheme(newTheme);
              }}
              className="flex items-center gap-3 w-full rounded-sm transition-all py-3 px-3 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              {mounted && (
                <>
                  {isDark ? (
                    <Sun className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Moon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>Switch mode</span>
                </>
              )}
              {!mounted && <div className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* PRO Upgrade Button */}
        {!isCollapsed && (
          <Link
            href="/pricing"
            className="flex items-center justify-between w-full bg-black dark:bg-[#F3F3F3] text-primary-foreground rounded-sm px-4 py-3 transition-all duration-200 cursor-pointer text-base font-semibold"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white dark:text-black">
                Upgrade to
              </span>
              <span className="bg-background text-black dark:text-white px-2 py-1 rounded-[0.4rem] text-sm font-bold">
                PRO
              </span>
            </div>
            <ArrowUpRight
              className={cn("w-6 h-6", isDark ? "text-black" : "text-white")}
            />
          </Link>
        )}

        {/* Moved UserControl to footer */}
        {!isCollapsed && (
          <div className="mt-3">
            <UserControl showName={true} />
          </div>
        )}
      </SidebarFooter>

    </Sidebar>
  );
}
