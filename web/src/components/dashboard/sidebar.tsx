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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditDisplay } from "@/components/credit-display";
import { Plus_Jakarta_Sans } from "next/font/google";
const jakarta = Plus_Jakarta_Sans({
  weight: "600", // e.g., SemiBold
  subsets: ["latin-ext", "vietnamese"],
});
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
  useSidebar,
} from "@/components/ui/sidebar";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "Create Course",
    icon: BookOpen,
    href: "/dashboard/generate-course",
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

  const initialCredits = 0; // Placeholder for actual user credit balance

  return (
    <UISidebar
      className={cn(
        "border-r h-full pl-5 border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950",
        className
      )}
    >
      <SidebarHeader className="p-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-900 dark:bg-stone-100">
            <Zap className="h-5 w-5 text-stone-50 dark:text-stone-900" />
          </div>
          <span
            className={`text-2xl leading-[32px] font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
          >
            SonicLearn
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">  
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
                      className={cn(
                        "w-full justify-start px-3 py-3 text-sm font-medium rounded-[12px] transition-colors",
                        isActive
                          ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 w-full"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto p-4 ">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-100 dark:bg-stone-900">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800">
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              BS
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
              Bhanu singh
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
              bhanusingh12345@gmail.com
            </p>
          </div>
        </div>
        {/* <div className="mt-3">
          <CreditDisplay initialCredits={initialCredits} />
        </div> */}
      </SidebarFooter>
    </UISidebar>
  );
}
