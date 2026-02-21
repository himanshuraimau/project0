"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Folder01Icon,
  FolderShared01Icon,
  HeadphonesIcon,
  Settings01Icon,
  Moon01Icon,
  Sun01Icon,
  SidebarLeft01Icon,
  ArrowRight01Icon,
  Shield01Icon,
  Note01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { UserControl } from "@/components/user-control";
import { SubscriptionCard } from "@/components/shared/SubscriptionCard";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";
import { subscriptionCache } from "@/lib/subscription-cache";

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
});

const useSidebar = () => useContext(SidebarContext);

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

interface AppSidebarProps {
  className?: string;
}

const dashboardItems: { title: string; icon: IconSvgElement; href: string }[] =
  [
    { title: "Dashboard", icon: Home01Icon, href: "/dashboard" },
    { title: "Folders", icon: Folder01Icon, href: "/dashboard/folders" },
    {
      title: "Shared With Me",
      icon: FolderShared01Icon,
      href: "/dashboard/cloned",
    },
    { title: "Support", icon: HeadphonesIcon, href: "/dashboard/support" },
    { title: "Settings", icon: Settings01Icon, href: "/settings" },
  ];

const SIDEBAR_WIDTH_EXPANDED = "280px";
const SIDEBAR_WIDTH_COLLAPSED = "72px";

const SidebarTrigger = ({ className }: { className?: string }) => {
  const { toggleSidebar, isCollapsed } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn(
        "flex items-center justify-center rounded-md transition-colors cursor-pointer",
        "text-muted-foreground hover:text-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        "w-9 h-9 shrink-0",
        className
      )}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <HugeiconsIcon
        icon={isCollapsed ? ArrowRight01Icon : SidebarLeft01Icon}
        className="size-[18px]"
      />
    </button>
  );
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { openUpgradeModal } = useUpgradeModal();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isDark = (resolvedTheme || theme) === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function checkProfile() {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.user?.role === "ADMIN");
        }
      } catch {
        // ignore
      }
    }
    checkProfile();
  }, []);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const data = await subscriptionCache.getStatus();
        const isActive = data.hasSubscription && data.access?.hasAccess;
        setHasActiveSubscription(isActive);
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    }

    const cached = subscriptionCache.getCached();
    if (cached) {
      setHasActiveSubscription(!!(cached.hasSubscription && cached.access?.hasAccess));
      setIsLoadingSubscription(false);
    }

    checkSubscription();

    const unsubscribe = subscriptionCache.subscribe((data) => {
      setHasActiveSubscription(!!(data.hasSubscription && data.access?.hasAccess));
      setIsLoadingSubscription(false);
    });

    return unsubscribe;
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <aside
        className={cn(
          "h-screen flex flex-col transition-[width] duration-200 ease-(--ease-default) overflow-x-hidden",
          "bg-sidebar text-sidebar-foreground",
          "border-r border-sidebar-border/60",
          isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
          className
        )}
        style={{
          width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        }}
      >
        {/* Header: logo + trigger — space-4 (16px) vertical, space-3 (12px) horizontal */}
        <header className="shrink-0 pt-5 pb-4 px-3 border-b border-sidebar-border/50">
          <div className="flex items-center gap-2 w-full group">
            {isCollapsed ? (
              <div className="relative flex items-center w-full justify-center min-h-[40px]">
                <img
                  src="/logo.png"
                  alt="Flinote"
                  className="h-10 w-auto rounded-md object-contain opacity-100 transition-opacity duration-150 group-hover:opacity-0 group-hover:invisible"
                />
                <SidebarTrigger className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto" />
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
                <SidebarTrigger />
              </>
            )}
          </div>
        </header>

        {/* Nav — flex-1, overflow auto, consistent padding */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <nav className="py-3 px-2" aria-label="Main">
            <ul
              className={cn(
                "flex flex-col",
                isCollapsed ? "items-center gap-1" : "gap-0.5"
              )}
            >
              {dashboardItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md transition-colors duration-150",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                        isCollapsed
                          ? "justify-center w-10 h-10 mx-auto"
                          : "gap-3 py-2.5 px-3 w-full",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-(--sidebar-accent)/70 hover:text-sidebar-foreground"
                      )}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        className="size-5 shrink-0"
                      />
                      {!isCollapsed && (
                        <span className="text-[15px] leading-snug truncate">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
              {isAdmin && (
                <>
                  <li className={cn("pt-2 mt-2 border-t border-sidebar-border/50", isCollapsed && "border-t-0 pt-0 mt-0")}>
                    <Link
                      href="/dashboard/admin"
                      className={cn(
                        "flex items-center rounded-md transition-colors duration-150",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                        pathname === "/dashboard/admin"
                          ? "bg-primary/15 text-primary font-medium border border-primary/30"
                          : "text-muted-foreground hover:bg-(--sidebar-accent)/70 hover:text-sidebar-foreground",
                        isCollapsed
                          ? "justify-center w-10 h-10 mx-auto"
                          : "gap-3 py-2.5 px-3 w-full"
                      )}
                    >
                      <HugeiconsIcon
                        icon={Shield01Icon}
                        className="size-5 shrink-0"
                      />
                      {!isCollapsed && (
                        <span className="text-[15px] leading-snug truncate">
                          Admin
                        </span>
                      )}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/admin/blog"
                      className={cn(
                        "flex items-center rounded-md transition-colors duration-150",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                        pathname?.startsWith("/dashboard/admin/blog")
                          ? "bg-primary/15 text-primary font-medium border border-primary/30"
                          : "text-muted-foreground hover:bg-(--sidebar-accent)/70 hover:text-sidebar-foreground",
                        isCollapsed
                          ? "justify-center w-10 h-10 mx-auto"
                          : "gap-3 py-2.5 px-3 w-full"
                      )}
                    >
                      <HugeiconsIcon
                        icon={Note01Icon}
                        className="size-5 shrink-0"
                      />
                      {!isCollapsed && (
                        <span className="text-[15px] leading-snug truncate">
                          Blog
                        </span>
                      )}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>

        {/* Footer: theme, subscription, user — mt-auto, clear separation */}
        <footer className="shrink-0 mt-auto pt-3 pb-4 px-2 border-t border-sidebar-border/70 space-y-2 overflow-x-hidden">
          {/* Theme toggle */}
          {mounted && (
            <>
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="flex items-center justify-center w-10 h-10 mx-auto rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
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
                  className="flex items-center gap-3 w-full rounded-md py-2.5 px-3 text-[15px] font-medium text-muted-foreground hover:text-foreground hover:bg-(--sidebar-accent)/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
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

          {/* Subscription — collapsed: icon only; expanded: card */}
          {isCollapsed && !isLoadingSubscription && (
            <div className="flex justify-center pt-1">
              {hasActiveSubscription ? (
                <div className="w-10 h-10 rounded-md bg-linear-to-br from-(--brand-500)/15 to-(--brand-600)/10 border border-(--brand-500)/25 flex items-center justify-center">
                  <span className="text-base" aria-hidden>
                    ✨
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openUpgradeModal}
                  className="w-10 h-10 rounded-md bg-sidebar-accent hover:bg-(--sidebar-accent)/80 border border-sidebar-border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Upgrade to PRO"
                >
                  <span className="text-base" aria-hidden>
                    ⚡
                  </span>
                </button>
              )}
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

          {/* User — collapsed: centered icon; expanded: full row */}
          {isCollapsed ? (
            <div className="pt-2 border-t border-sidebar-border flex justify-center">
              <UserControl showName={false} />
            </div>
          ) : (
            <div className="pt-3 mt-1 border-t border-sidebar-border">
              <UserControl showName={true} />
            </div>
          )}
        </footer>
      </aside>
    </SidebarContext.Provider>
  );
}
