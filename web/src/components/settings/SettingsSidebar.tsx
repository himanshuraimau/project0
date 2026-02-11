"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserIcon,
  GlobeIcon,
  Notification01Icon,
  HeadphonesIcon,
  CreditCardIcon,
  StarIcon,
  SidebarLeft01Icon,
} from "@hugeicons/core-free-icons";
import { SubscriptionCard } from "@/components/shared/SubscriptionCard";
import { cn } from "@/lib/utils";

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
});

const useSidebar = () => useContext(SidebarContext);

const settingsNavItems: {
  title: string;
  icon: typeof UserIcon;
  href: string;
  id: string;
  emoji?: string;
  iconClassName?: string;
}[] = [
  { title: "Profile", icon: UserIcon, href: "/settings", id: "profile" },

  {
    title: "Notifications",
    icon: Notification01Icon,
    href: "/settings/notifications",
    id: "notifications",
  },
  {
    title: "Contact support",
    icon: HeadphonesIcon,
    href: "/dashboard/support",
    id: "support",
  },
  {
    title: "Subscription",
    icon: CreditCardIcon,
    href: "/settings/subscription",
    id: "subscription",
  },
];

interface SettingsSidebarProps {
  className?: string;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar, isCollapsed } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn(
        "flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background cursor-pointer",
        className
      )}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <HugeiconsIcon
        icon={SidebarLeft01Icon}
        className={cn(
          "size-5 transition-transform duration-200",
          isCollapsed && "rotate-180"
        )}
      />
    </button>
  );
}

export function SettingsSidebar({
  className,
  activeItem = "profile",
  onItemClick,
}: SettingsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          const isActive = data.hasSubscription && data.access?.hasAccess;
          setHasActiveSubscription(isActive);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    }
    checkSubscription();
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <aside
        className={cn(
          "h-screen sticky top-0 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-[280px]",
          className
        )}
      >
        <div className="flex h-full flex-col overflow-hidden py-5 px-4">
          {/* Header: Back + Settings title (or collapse only when collapsed) */}
          {!isCollapsed ? (
            <div className=" pb-5">
              <div className="flex items-center justify-between gap-2 mb-5">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 rounded-lg py-2 pr-2 -ml-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    className="size-5 shrink-0"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    Back to Dashboard
                  </span>
                </Link>
                <SidebarTrigger />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Settings
              </h2>
            </div>
          ) : (
            <div className="mb-4 flex justify-center">
              <SidebarTrigger />
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto">
            <ul
              className={cn(
                "space-y-1",
                isCollapsed && "flex flex-col items-center"
              )}
            >
              {settingsNavItems.map((item) => {
                const isActive = activeItem === item.id;
                const linkContent = (
                  <span
                    className={cn(
                      "flex items-center rounded-xl transition-colors cursor-pointer",
                      isCollapsed
                        ? "justify-center size-11 px-0"
                        : "gap-3 px-3 py-2.5 h-11",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.emoji ? (
                      <span className="text-xl leading-none">{item.emoji}</span>
                    ) : (
                      <HugeiconsIcon
                        icon={item.icon}
                        className={cn(
                          "size-5 shrink-0",
                          isActive && "text-primary",
                          item.iconClassName && !isActive && item.iconClassName
                        )}
                      />
                    )}
                    {!isCollapsed && (
                      <span
                        className={cn(
                          "text-[15px] font-medium truncate",
                          isActive ? "text-primary" : "text-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                    )}
                  </span>
                );

                return (
                  <li key={item.id}>
                    {item.id === "logout" ? (
                      <button
                        type="button"
                        onClick={() => onItemClick?.(item.id)}
                        className="w-full text-left"
                      >
                        {linkContent}
                      </button>
                    ) : (
                      <Link href={item.href}>{linkContent}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Subscription card */}
          {!isCollapsed && (
            <div className="mt-auto pt-4 pb-2">
              <SubscriptionCard
                hasActiveSubscription={hasActiveSubscription}
                isLoading={isLoadingSubscription}
                isDark={false}
              />
            </div>
          )}

          {/* Footer: Privacy, Terms */}
          {!isCollapsed && (
            <div className="mt-auto flex flex-wrap items-center justify-center gap-5 py-4 border-t border-border/80">
              <Link
                href="/privacy"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Terms
              </Link>
            </div>
          )}
        </div>
      </aside>
    </SidebarContext.Provider>
  );
}
