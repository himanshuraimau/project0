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
  weight: ["400", "600"],
  subsets: ["latin-ext", "vietnamese"],
});
import {
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

  return (
    <div
      className={cn(
        "border-r  h-screen w-[280px] border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950",
        className
      )}
    >
      <div className="h-full">
        <div className="border-b py-6 border-stone-200 w-full  dark:border-stone-800">
          <div className="flex items-center gap-2 pl-9">
            <div className="flex items-center justify-center size-7 rounded-lg bg-stone-900 dark:bg-stone-100">
              <Zap className="size-4 text-stone-50 dark:text-stone-900" />
            </div>
            <span
              className={`text-xl leading-[32px] font-semibold text-stone-900 dark:text-stone-100 ${jakarta.className}`}
            >
              SonicLearn
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <SidebarContent className="pt-2 flex flex-col w-full px-4 justify-center">
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
                            "w-full flex items-center justify-start my-2 px-[16px] py-[10px] text-[16px] font-normal rounded-[12px] transition-colors bg-stone-50 dark:bg-stone-900 ",
                            isActive
                              ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                              : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                          )}
                        >
                          <Link
                            href={item.href}
                            className="flex items-center gap-2 w-full "
                          >
                            <Icon className="size-[22px] flex-shrink-0" />
                            <span className={`leading-[24px] font-normal`}>
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

          <SidebarFooter className="mt-auto w-full px-4">
            <div className="flex items-center gap-4 rounded-lg">
              <div className="flex items-center justify-center size-10 rounded-full bg-stone-200 dark:bg-stone-800">
                <span className="text-sm  font-semibold text-stone-900 dark:text-stone-100">
                  BS
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <p className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                  Bhanu singh
                </p>
                <p className="text-xs font-normal leading-5 text-stone-600 dark:text-stone-400 truncate">
                  bhanusingh12345@gmail.com
                </p>
              </div>
            </div>
          </SidebarFooter>
        </div>
      </div>
    </div>
  );
}
