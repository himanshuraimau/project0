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
        "border-r  top-0 h-screen  border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950",
        className
      )}
    >
      <SidebarHeader className="border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2 pl-6">
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

      <SidebarContent className="">
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
                        "w-[248px] flex items-center justify-start my-2 px-[16px] py-[10px] text-lg font-medium rounded-[12px] transition-colors",
                        isActive
                          ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 w-full "
                      >
                        <Icon className="size-[22px] flex-shrink-0" />
                        <span
                          className={`font-medium text-[18px] leading-[28px] `}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto w-full">
        <div className="flex items-center gap-5 rounded-lg">
          <div className="flex items-center justify-center rounded-[64px] size-[52px] bg-stone-200 dark:bg-stone-800">
            <span className="text-sm  font-semibold text-stone-900 dark:text-stone-100">
              BS
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            <p className="text-lg font-medium text-stone-900 dark:text-stone-100 truncate">
              Bhanu singh
            </p>
            <p className="text-sm font-normal leading-5 text-stone-600 dark:text-stone-400 truncate">
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
