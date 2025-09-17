"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
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
  useSidebar,
} from "@/components/ui/sidebar";

const notesSidebarItems = [
  { title: "Create Note", icon: Plus, href: "/notes/new" },
  { title: "Search", icon: Search, href: "/notes/search" },
];

interface NotesAppSidebarProps {
  className?: string;
}

export function NotesAppSidebar({ className }: NotesAppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r h-screen bg-white dark:border-stone-800 dark:bg-stone-950",
        className
      )}
    >
      {/* Sidebar Header */}
      <SidebarHeader className="border-b py-6 border-stone-200 dark:border-stone-800">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 px-4">
            <div className="flex items-center justify-center size-8 rounded-lg bg-stone-900 dark:bg-stone-100">
              <Zap className="size-5 text-stone-50 dark:text-stone-900" />
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <Menu className="size-6" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-stone-900 dark:bg-stone-100">
                <Zap className="size-5 text-stone-50 dark:text-stone-900" />
              </div>
              <span
                className={`text-xl leading-[32px] font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
              >
                SonicLearn
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <ChevronLeft className="size-6" />
            </button>
          </div>
        )}
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className={cn(
        "flex-1 pt-2",
        isCollapsed ? "px-1 flex flex-col items-center" : "px-2"
      )}>
        <SidebarGroup className={isCollapsed ? "w-full flex flex-col items-center" : ""}>
          <SidebarGroupContent>
            <SidebarMenu className={cn(
              "space-y-1",
              isCollapsed && "flex flex-col items-center w-full"
            )}>
              {notesSidebarItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href} className={isCollapsed ? "flex justify-center" : ""}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "flex items-center gap-3 rounded-lg transition-colors",
                        isCollapsed ? "w-16 h-16 justify-center" : "px-3 py-2 my-2",
                        isActive
                          ? "!bg-gray-300 !text-black dark:!bg-gray-900 dark:!text-white"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      )}
                    >
                      <Link href={item.href} className={cn(
                        "flex items-center gap-3",
                        isCollapsed ? "w-full justify-center" : "w-full"
                      )}>
                        <Icon className={cn(
                          "!size-5 flex-shrink-0",
                          isCollapsed ? "" : ""
                        )} />
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

      {/* Removed Notes Hub footer - dashboard handles all notes functionality */}
    </Sidebar>
  );
}