"use client";

import React from "react";
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
  useSidebar,
} from "@/components/ui/sidebar";

const sidebarItems = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  {
    title: "Create Course",
    icon: BookOpen,
    href: "/dashboard/generate-course",
  },
  { title: "How to use", icon: HelpCircle, href: "/dashboard/how-to-use" },
  { title: "Support", icon: HeadphonesIcon, href: "/dashboard/support" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
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
        "border-r h-screen bg-white border-stone-200 dark:border-stone-900 dark:bg-stone-900",
        className
      )}
    >
      <SidebarHeader className="border-b py-[16px] bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-900">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 px-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 cursor-pointer dark:hover:bg-stone-800 rounded-md transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 9C1.5 6.23315 1.5 4.84973 2.11036 3.86908C2.33617 3.50627 2.61668 3.1907 2.93918 2.93665C3.81087 2.25 5.04058 2.25 7.5 2.25H10.5C12.9594 2.25 14.1891 2.25 15.0608 2.93665C15.3833 3.1907 15.6638 3.50627 15.8896 3.86908C16.5 4.84973 16.5 6.23315 16.5 9C16.5 11.7668 16.5 13.1503 15.8896 14.1309C15.6638 14.4937 15.3833 14.8093 15.0608 15.0634C14.1891 15.75 12.9594 15.75 10.5 15.75H7.5C5.04058 15.75 3.81087 15.75 2.93918 15.0634C2.61668 14.8093 2.33617 14.4937 2.11036 14.1309C1.5 13.1503 1.5 11.7668 1.5 9Z"
                  stroke="#4E4E4E"
                  stroke-width="1.4"
                />
                <path
                  d="M7.125 2.25V15.75"
                  stroke="#4E4E4E"
                  stroke-width="1.4"
                  stroke-linejoin="round"
                />
                <path
                  d="M3.75 5.25H4.5M3.75 7.5H4.5"
                  stroke="#4E4E4E"
                  stroke-width="1.125"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-lg leading-[28px] font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
              >
                SonicLearn
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer rounded-md transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.5 9C1.5 6.23315 1.5 4.84973 2.11036 3.86908C2.33617 3.50627 2.61668 3.1907 2.93918 2.93665C3.81087 2.25 5.04058 2.25 7.5 2.25H10.5C12.9594 2.25 14.1891 2.25 15.0608 2.93665C15.3833 3.1907 15.6638 3.50627 15.8896 3.86908C16.5 4.84973 16.5 6.23315 16.5 9C16.5 11.7668 16.5 13.1503 15.8896 14.1309C15.6638 14.4937 15.3833 14.8093 15.0608 15.0634C14.1891 15.75 12.9594 15.75 10.5 15.75H7.5C5.04058 15.75 3.81087 15.75 2.93918 15.0634C2.61668 14.8093 2.33617 14.4937 2.11036 14.1309C1.5 13.1503 1.5 11.7668 1.5 9Z"
                  stroke="#4E4E4E"
                  stroke-width="1.4"
                />
                <path
                  d="M7.125 2.25V15.75"
                  stroke="#4E4E4E"
                  stroke-width="1.4"
                  stroke-linejoin="round"
                />
                <path
                  d="M3.75 5.25H4.5M3.75 7.5H4.5"
                  stroke="#4E4E4E"
                  stroke-width="1.125"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent
        className={cn(
          "flex-1 pt-2 bg-white dark:bg-stone-950",
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
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
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
                        "flex items-center rounded-[6px] transition-colors",
                        isCollapsed ? "w-16 h-16 justify-center" : "px-4 py-5",
                        isActive
                          ? "!bg-stone-100 !text-black dark:!bg-stone-900 dark:!text-white"
                          : "text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      )}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3",
                          isCollapsed ? "w-full justify-center" : "w-full"
                        )}
                      >
                        <Icon
                          className={cn(
                            "!size-4 flex-shrink-0",
                            isCollapsed ? "" : ""
                          )}
                        />
                        {!isCollapsed && (
                          <span className="leading-[24px] font-normal">
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

      <SidebarFooter className="mt-auto w-full px-3 py-4 border-t border-stone-200 bg-white dark:border-stone-900 dark:bg-stone-950">
        <div
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-lg shadow-sm transition-colors duration-200",
            "bg-stone-50 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800",
            isCollapsed ? "mx-auto justify-center w-14" : "mx-auto"
          )}
        >
          <span className="text-stone-600 text-xl dark:text-stone-400">⚡</span>
          {!isCollapsed && (
            <span className="font-medium text-stone-900 dark:text-stone-100">
              Unlimited Notes
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
