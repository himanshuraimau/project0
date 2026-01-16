"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Folder,
  BookOpen,
  Share2,
  Settings,
  ArrowLeft,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { UserControl } from "@/components/user-control";
import { useSidebar } from "@/components/ui/sidebar";
import { SubscriptionCard } from "@/components/shared/SubscriptionCard";

interface NoteAppSidebarProps {
  className?: string;
  noteId?: string;
}

export function NoteAppSidebar({ className, noteId }: NoteAppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { state } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const isCollapsed = state === "collapsed";
  const isDark = (resolvedTheme || theme) === "dark";
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch subscription status
  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          const isActive = data.hasSubscription && data.access?.hasAccess;
          setHasActiveSubscription(isActive);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    }
    checkSubscription();
  }, []);

  const isChildPage = pathname !== `/notes/${noteId}`;

  const handleBackNavigation = () => {
    if (isChildPage) {
      router.push(`/notes/${noteId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const navItems = [
    { title: "Folders", icon: Folder, href: "/dashboard/folders" },
    { title: "Create Course", icon: BookOpen, href: "/dashboard/generate-course" },
    { title: "Shared with Me", icon: Share2, href: "/dashboard/cloned" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  const SidebarTriggerButton = ({ className: btnClassName }: { className?: string }) => {
    const { toggleSidebar } = useSidebar();

    return (
      <button
        onClick={toggleSidebar}
        className={cn(
          "flex items-center justify-center rounded-md transition-colors cursor-pointer",
          btnClassName
        )}
        aria-label="Toggle sidebar"
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
            strokeWidth="1.4"
          />
          <path
            d="M7.125 2.25V15.75"
            stroke="#4E4E4E"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M3.75 5.25H4.5M3.75 7.5H4.5"
            stroke="#4E4E4E"
            strokeWidth="1.125"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen transition-all duration-300 ease-in-out",
        "dark:bg-[#1A1A1A] bg-[#F9FAFB]",
        "border-r border-neutral-200 dark:border-[#212121]",
        isCollapsed ? "w-[72px]" : "w-[280px]",
        className
      )}
    >
      <div className="w-full h-full py-5 px-[14px] flex flex-col">
        {/* Header with Logo */}
        <div className="mb-6">
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
                <SidebarTriggerButton className="absolute opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10 pointer-events-none group-hover:pointer-events-auto" />
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
                <div className="text-foreground flex-1">
                  <div className="text-lg font-semibold leading-5">
                    JelliNote AI
                  </div>
                  <div className="text-sm text-muted-foreground font-medium leading-4">
                    Smart Notes
                  </div>
                </div>
                <SidebarTriggerButton className="text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10" />
              </>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBackNavigation}
            className={cn(
              "flex items-center w-full px-4 py-3 rounded-[10px] transition-colors",
              "dark:bg-[#202020] bg-neutral-100 dark:text-white text-black",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <ArrowLeft className="size-[18px] shrink-0" />
            {!isCollapsed && (
              <span className="leading-5 text-[16px] font-normal">
                {isChildPage ? "Back to Notes" : "Dashboard"}
              </span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav>
            <ul
              className={cn(
                "space-y-2",
                isCollapsed && "flex flex-col items-center"
              )}
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-baseline px-4 py-3 rounded-[10px] transition-colors",
                        isCollapsed ? "justify-center w-full" : "w-full gap-3",
                        isActive
                          ? "dark:bg-[#202020] bg-neutral-100 dark:text-white text-black"
                          : "text-neutral-500 dark:text-[#909090] hover:bg-neutral-100/50 dark:hover:bg-[#202020]/50"
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      {!isCollapsed && (
                        <span className="leading-5 text-[16px] font-normal">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Footer */}
        <div className="mt-auto space-y-4">
          {!isCollapsed && (
            <div>
              <button
                onClick={() => {
                  const newTheme = isDark ? "light" : "dark";
                  setTheme(newTheme);
                }}
                className="flex items-center gap-3 w-full rounded-[10px] transition-all py-3.5 px-4 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
              >
                {mounted && (
                  <>
                    {isDark ? (
                      <Sun className="w-5 h-5 shrink-0" />
                    ) : (
                      <Moon className="w-5 h-5 shrink-0" />
                    )}
                    <span>Switch mode</span>
                  </>
                )}
                {!mounted && <div className="w-5 h-5" />}
              </button>
            </div>
          )}

          {!isCollapsed && (
            <SubscriptionCard
              hasActiveSubscription={hasActiveSubscription}
              isLoading={isLoadingSubscription}
              isDark={isDark}
            />
          )}

          {!isCollapsed && (
            <div className="mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <UserControl showName={true} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

