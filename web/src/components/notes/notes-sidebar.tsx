"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Zap, Menu, ChevronLeft } from "lucide-react";
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

      {/* Sidebar Content */}
      <SidebarContent
        className={cn(
          "flex-1 pt-2",
          isCollapsed ? "px-1 flex flex-col items-center" : "px-2"
        )}
      >
        <SidebarGroup
          className={isCollapsed ? "w-full flex flex-col items-center" : ""}
        >
          <SidebarGroupContent>
            <SidebarMenu
              className={cn(
                "space-y-1",
                isCollapsed && "flex flex-col items-center w-full"
              )}
            >
              {notesSidebarItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem
                    key={item.href}
                    className={isCollapsed ? "flex justify-center" : ""}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "flex items-center gap-4 rounded-lg transition-colors",
                        isCollapsed
                          ? "w-18 h-18 justify-center"
                          : "px-4 py-3 my-2",
                        isActive
                          ? "!bg-gray-300 !text-black dark:!bg-gray-900 dark:!text-white"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      )}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-4",
                          isCollapsed ? "w-full justify-center" : "w-full"
                        )}
                      >
                        <Icon
                          className={cn(
                            "!size-6 flex-shrink-0",
                            isCollapsed ? "" : ""
                          )}
                        />
                        {!isCollapsed && (
                          <span className="text-base leading-[28px] font-normal">
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

      {/* Removed Notes Hub footer - dashboard handles all notes functionality */}
    </Sidebar>
  );
}
