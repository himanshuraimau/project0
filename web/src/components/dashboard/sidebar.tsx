"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  HelpCircle,
  Headphones,
  Settings,
  BookOpen,
  Zap,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarFooterControls } from "@/components/shared/sidebar-footer-controls";

const sidebarItems = [
  {
    section: "Main",
    items: [
      { title: "Dashboard", icon: Home, href: "/dashboard" },
      { title: "My Courses", icon: BookOpen, href: "/dashboard/generate-course" },
    ]
  },
  {
    section: "Learning Tools",
    items: [
      { title: "Create Notes", icon: Zap, href: "/dashboard/notes" },
    ]
  },
  {
    section: "Support",
    items: [
      { title: "Help Center", icon: HelpCircle, href: "/dashboard/how-to-use" },
      { title: "Contact Support", icon: Headphones, href: "/dashboard/support" },
      { title: "Settings", icon: Settings, href: "/dashboard/settings" },
    ]
  }
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "h-screen bg-white dark:bg-stone-950 border-r border-sidebar-border",
        className
      )}
    >
      <SidebarHeader className="border-b pt-4 pb-4 bg-sidebar border-sidebar-border flex-shrink-0">
        <div className="flex items-center justify-between px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <LayoutDashboard className="w-6 h-6 text-accent flex-shrink-0" />
              <h1 className="text-lg font-semibold text-sidebar-foreground truncate">
                Dashboard
              </h1>
            </div>
          )}
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      {/* <SidebarHeader className="border-b py-6 bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-900">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 px-4">
            <button
              onClick={toggleSidebar}
              className="p-4 hover:bg-stone-100 cursor-pointer dark:hover:bg-stone-800 rounded-xl transition-all duration-200 hover:"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-accent"
              >
                <path
                  d="M1.5 9C1.5 6.23315 1.5 4.84973 2.11036 3.86908C2.33617 3.50627 2.61668 3.1907 2.93918 2.93665C3.81087 2.25 5.04058 2.25 7.5 2.25H10.5C12.9594 2.25 14.1891 2.25 15.0608 2.93665C15.3833 3.1907 15.6638 3.50627 15.8896 3.86908C16.5 4.84973 16.5 6.23315 16.5 9C16.5 11.7668 16.5 13.1503 15.8896 14.1309C15.6638 14.4937 15.3833 14.8093 15.0608 15.0634C14.1891 15.75 12.9594 15.75 10.5 15.75H7.5C5.04058 15.75 3.81087 15.75 2.93918 15.0634C2.61668 14.8093 2.33617 14.4937 2.11036 14.1309C1.5 13.1503 1.5 11.7668 1.5 9Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M7.125 2.25V15.75"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.75 5.25H4.5M3.75 7.5H4.5"
                  stroke="currentColor"
                  strokeWidth="1.125"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">S</span>
              </div>
              <span
                className={`text-2xl leading-[32px] font-bold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
              >
                apple
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-3 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer rounded-lg transition-all duration-200 hover:"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-stone-500 dark:text-stone-400"
              >
                <path
                  d="M1.5 9C1.5 6.23315 1.5 4.84973 2.11036 3.86908C2.33617 3.50627 2.61668 3.1907 2.93918 2.93665C3.81087 2.25 5.04058 2.25 7.5 2.25H10.5C12.9594 2.25 14.1891 2.25 15.0608 2.93665C15.3833 3.1907 15.6638 3.50627 15.8896 3.86908C16.5 4.84973 16.5 6.23315 16.5 9C16.5 11.7668 16.5 13.1503 15.8896 14.1309C15.6638 14.4937 15.3833 14.8093 15.0608 15.0634C14.1891 15.75 12.9594 15.75 10.5 15.75H7.5C5.04058 15.75 3.81087 15.75 2.93918 15.0634C2.61668 14.8093 2.33617 14.4937 2.11036 14.1309C1.5 13.1503 1.5 11.7668 1.5 9Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M7.125 2.25V15.75"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.75 5.25H4.5M3.75 7.5H4.5"
                  stroke="currentColor"
                  strokeWidth="1.125"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </SidebarHeader> */}

      <SidebarContent
        className={cn(
          "flex-1 pt-8 bg-white dark:bg-stone-950",
          isCollapsed ? "px-3 flex flex-col items-center" : "px-6"
        )}
      >
        {sidebarItems.map((section) => (
          <SidebarGroup
            key={section.section}
            className={cn(
              "mb-8",
              isCollapsed ? "w-full flex flex-col items-center" : ""
            )}
          >
            {!isCollapsed && (
              <div className="px-4 pb-4">
                <h3 className="text-sm uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                  {section.section}
                </h3>
              </div>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu
                className={cn(
                  "space-y-3",
                  isCollapsed && "flex flex-col items-center w-full"
                )}
              >
                {section.items.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <SidebarMenuItem
                      key={item.href}
                      className={isCollapsed ? "flex justify-center" : ""}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "group flex items-center rounded-xl transition-all duration-200 ease-in-out",
                          isCollapsed ? "w-14 h-14 justify-center" : "px-6 py-5",
                          isActive
                            ? "bg-accent text-white dark:text-white  border-l-4 border-accent"
                            : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100 hover:"
                        )}
                      >
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-6",
                            isCollapsed ? "w-full justify-center" : "w-full"
                          )}
                        >
                          <item.icon className="w-7 h-7 flex-shrink-0 transition-transform group-hover:scale-110" />
                          {!isCollapsed && (
                            <span className="text-lg font-medium leading-relaxed">
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
        ))}
      </SidebarContent>

      <SidebarFooterControls>
        {/* Upgrade to PRO Button */}
        <Link 
          href="/pricing"
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200",
            "bg-accent/10 hover:bg-accent/20 border border-accent/30",
            "group cursor-pointer",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-accent-foreground text-base font-bold">⚡</span>
          </div>
          {!isCollapsed && (
            <>
              <span className="text-sm font-semibold text-foreground">
                Upgrade to PRO
              </span>
              <ArrowRight className="w-4 h-4 ml-auto text-accent group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Link>
      </SidebarFooterControls>
    </Sidebar>
  );
}
