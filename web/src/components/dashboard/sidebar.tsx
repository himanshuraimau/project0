"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  HelpCircle,
  Headphones,
  Settings,
  BookOpen,
  Zap,
  ArrowUpRight,
  LayoutDashboard,
  Share2,
  Folder,
} from 'lucide-react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";

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
      // TODO: COURSE_GENERATION_FEATURE - Uncomment to re-enable course generation feature
      // { title: "My Courses", icon: BookOpen, href: "/dashboard/generate-course" },
    ]
  },
  {
    section: "Learning Tools",
    items: [
      { title: "Create Notes", icon: Zap, href: "/dashboard/notes" },
      { title: "My Folders", icon: Folder, href: "/dashboard/folders" },
      { title: "Shared With Me", icon: Share2, href: "/dashboard/cloned" },
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
  const { theme } = useTheme();
  const { openUpgradeModal } = useUpgradeModal();
  const isCollapsed = state === "collapsed";
  const isDark = theme === "dark";
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  console.log('AppSidebar rendered - hasActiveSubscription:', hasActiveSubscription, 'isLoadingSubscription:', isLoadingSubscription);

  // Fetch subscription status
  useEffect(() => {
    async function checkSubscription() {
      try {
        console.log('Fetching subscription status...');
        // Use cached subscription data with request deduplication
        const { subscriptionCache } = await import('@/lib/subscription-cache');
        const data = await subscriptionCache.getStatus();
        console.log('Subscription data from sidebar:', data);
          const isActive = data.hasSubscription && data.access?.hasAccess;
          console.log('Setting hasActiveSubscription to:', isActive);
          setHasActiveSubscription(isActive);

      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        console.log('Setting isLoadingSubscription to false');
        setIsLoadingSubscription(false);
      }
    }
    checkSubscription();
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "h-screen bg-white dark:bg-stone-950 border-r border-sidebar-border overflow-x-hidden",
        className
      )}
    >
      <SidebarHeader className="border-b pt-4 pb-4 bg-sidebar border-sidebar-border shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <LayoutDashboard className="w-6 h-6 text-accent shrink-0" />
              <h1 className="text-lg font-semibold text-sidebar-foreground truncate">
                Dashboard
              </h1>
            </div>
          )}
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent
        className={cn(
          "flex-1 pt-8 bg-white dark:bg-stone-950 overflow-x-hidden",
          isCollapsed ? "flex flex-col items-center" : ""
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
              <div className="pb-4">
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
                          "group flex items-center rounded-xl transition-all duration-200 ease-in-out w-full",
                          isCollapsed ? "h-14 justify-center" : "",
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
                          <item.icon className="w-7 h-7 shrink-0 transition-transform group-hover:scale-110" />
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
        {/* Upgrade to PRO Button - Only show for free tier users */}
        {!isLoadingSubscription && !hasActiveSubscription && (
          <button
            type="button"
            onClick={openUpgradeModal}
            className={cn(
              "flex items-center gap-3 rounded-lg py-3 transition-all duration-200 overflow-hidden",
              "bg-accent/10 hover:bg-accent/20 border border-accent/30",
              "group cursor-pointer w-full",
              isCollapsed ? "justify-center px-2" : "px-4"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-accent-foreground text-base font-bold">⚡</span>
            </div>
            {!isCollapsed && (
              <>
                <span className="text-sm font-semibold text-foreground truncate">
                  Upgrade to PRO
                </span>
                <ArrowUpRight className={cn("w-6 h-6 shrink-0", isDark ? "text-black" : "text-white")} />
              </>
            )}
          </button>
        )}

        {/* Pro User Badge - Show for subscribed users */}
        {!isLoadingSubscription && hasActiveSubscription && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg py-3 overflow-hidden",
              "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30",
              isCollapsed ? "justify-center w-full px-2" : "px-4"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <span className="text-white text-base font-bold">✨</span>
            </div>
            {!isCollapsed && (
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                Pro Active
              </span>
            )}
          </div>
        )}
      </SidebarFooterControls>
    </Sidebar>
  );
}
