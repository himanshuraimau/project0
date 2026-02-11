"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  SidebarLeft01Icon,
  Folder01Icon,
  FolderShared01Icon,
  Settings01Icon,
  Sun01Icon,
  Moon01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { UserControl } from "@/components/user-control";
import { useSidebar } from "@/components/ui/sidebar";
import { SubscriptionCard } from "@/components/shared/SubscriptionCard";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";

const SIDEBAR_WIDTH_EXPANDED = "280px";
const SIDEBAR_WIDTH_COLLAPSED = "72px";

interface NoteAppSidebarProps {
  className?: string;
  noteId?: string;
}

export function NoteAppSidebar({ className, noteId }: NoteAppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { state, toggleSidebar } = useSidebar();
  const { openUpgradeModal } = useUpgradeModal();
  const [mounted, setMounted] = useState(false);
  const isCollapsed = state === "collapsed";
  const isDark = (resolvedTheme || theme) === "dark";
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await fetch("/api/subscription/status");
        if (res.ok) {
          const data = await res.json();
          setHasActiveSubscription(
            !!data.hasSubscription && !!data.access?.hasAccess,
          );
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingSubscription(false);
      }
    }
    checkSubscription();
  }, []);

  const isChildPage = pathname !== `/notes/${noteId}`;

  const handleBack = () => {
    if (isChildPage) router.push(`/notes/${noteId}`);
    else router.push("/dashboard");
  };

  const navItems = [
    { title: "Folders", icon: Folder01Icon, href: "/dashboard/folders" },
    {
      title: "Shared with Me",
      icon: FolderShared01Icon,
      href: "/dashboard/cloned",
    },
    { title: "Settings", icon: Settings01Icon, href: "/dashboard/settings" },
  ];

  return (
    <aside
      className={cn(
        "h-screen flex flex-col transition-[width] duration-200 overflow-x-hidden",
        "bg-sidebar text-sidebar-foreground",
        "border-r border-sidebar-border/50",
        isCollapsed ? "w-[72px]" : "w-[260px]",
        className,
      )}
      style={{
        width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
      }}
    >
      {/* Header */}
      <header className="shrink-0 pt-5 pb-4 px-3 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 w-full group">
          {isCollapsed ? (
            <div className="relative flex items-center w-full justify-center min-h-[40px]">
              <img
                src="/logo.png"
                alt="Flinote"
                className="h-10 w-auto rounded-md object-contain opacity-100 transition-opacity duration-150 group-hover:opacity-0 group-hover:invisible"
              />
              <button
                type="button"
                onClick={toggleSidebar}
                className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                aria-label="Expand sidebar"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
              </button>
            </div>
          ) : (
            <>
              <img
                src="/logo.png"
                alt="Flinote"
                className="h-10 w-auto rounded-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-semibold leading-tight tracking-tight truncate">
                  Flinote
                </div>
                <div className="text-[13px] text-muted-foreground font-medium leading-tight truncate">
                  Smart Notes
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex items-center justify-center size-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar shrink-0"
                aria-label="Collapse sidebar"
              >
                <HugeiconsIcon icon={SidebarLeft01Icon} className="size-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Back */}
      <div className="px-2 pt-3">
        <button
          type="button"
          onClick={handleBack}
          className={cn(
            "flex items-center w-full rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
            isCollapsed
              ? "justify-center size-10 mx-auto"
              : "gap-3 py-2.5 px-3",
            "bg-sidebar-accent/80 text-sidebar-accent-foreground hover:bg-sidebar-accent font-medium",
          )}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5 shrink-0" />
          {!isCollapsed && (
            <span className="text-[15px] leading-snug truncate">
              {isChildPage ? "Back to note" : "Dashboard"}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-3 px-2"
        aria-label="Notes"
      >
        <ul
          className={cn(
            "flex flex-col",
            isCollapsed ? "items-center gap-1" : "gap-0.5",
          )}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                    isCollapsed
                      ? "justify-center w-10 h-10 mx-auto"
                      : "gap-3 py-2.5 px-3 w-full",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                  )}
                >
                  <HugeiconsIcon icon={item.icon} className="size-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="text-[15px] leading-snug truncate">
                      {item.title}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <footer className="shrink-0 mt-auto pt-3 pb-4 px-2 border-t border-sidebar-border/70 space-y-2 overflow-x-hidden">
        {/* Theme */}
        {mounted && (
          <>
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center justify-center size-10 mx-auto rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                aria-label="Toggle theme"
              >
                <HugeiconsIcon
                  icon={isDark ? Sun01Icon : Moon01Icon}
                  className="size-5"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center gap-3 w-full rounded-md py-2.5 px-3 text-[15px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                aria-label="Toggle theme"
              >
                <HugeiconsIcon
                  icon={isDark ? Sun01Icon : Moon01Icon}
                  className="size-5 shrink-0"
                />
                <span>Switch mode</span>
              </button>
            )}
          </>
        )}
        {!mounted && !isCollapsed && (
          <div className="flex items-center gap-3 w-full rounded-md py-2.5 px-3">
            <div className="size-5 shrink-0 rounded bg-muted" />
            <span className="text-[15px] text-muted-foreground">
              Switch mode
            </span>
          </div>
        )}

        {!isCollapsed && (
          <SubscriptionCard
            hasActiveSubscription={hasActiveSubscription}
            isLoading={isLoadingSubscription}
            isDark={isDark}
            onUpgradeClick={openUpgradeModal}
          />
        )}

        <div
          className={cn(
            "pt-3 border-t border-sidebar-border/70",
            isCollapsed && "flex justify-center",
          )}
        >
          <UserControl showName={!isCollapsed} />
        </div>
      </footer>
    </aside>
  );
}
