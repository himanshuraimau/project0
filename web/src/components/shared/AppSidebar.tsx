"use client";

import { useEffect, useState, createContext, useContext } from "react";
import {
  HelpCircle,
  Headphones,
  Settings,
  BookOpen,
  Grid3X3,
  Moon,
  ArrowUpRight,
  Sun,
  Menu,
  Home,
  Youtube,
  Folder,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { UserControl } from "@/components/user-control";
import { SubscriptionCard } from "@/components/shared/SubscriptionCard";

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => { },
});

const useSidebar = () => useContext(SidebarContext);

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

interface AppSidebarProps {
  className?: string;
}

const dashboardItems = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  { title: "Folders", icon: Folder, href: "/dashboard/folders" },
  { title: "Shared With Me", icon: Grid3X3, href: "/dashboard/cloned" },
  {
    title: "Create Course",
    icon: Youtube,
    href: "/dashboard/generate-course",
  },
  { title: "Support", icon: Headphones, href: "/dashboard/support" },
  { title: "Settings", icon: Settings, href: "/settings" },
];

const SidebarTrigger = ({ className }: { className?: string }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "flex items-center justify-center rounded-md  transition-colors cursor-pointer",
        className
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

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const isDark = (resolvedTheme || theme) === "dark";

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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <aside
        className={cn(
          "h-screen transition-all duration-300 ease-in-out overflow-x-hidden",
          "dark:bg-[#1A1A1A] bg-[#F9FAFB]",
          "border-r border-neutral-200 dark:border-[#212121]",
          isCollapsed ? "w-[72px]" : "w-[280px]",
          className
        )}
      >
        <div className="w-full h-full py-5 px-[14px] flex flex-col overflow-x-hidden">
          <div className="mb-6">
            <div className="flex items-center gap-2 w-full group">
              {isCollapsed ? (
                <div className="relative flex items-center w-full justify-center">
                  <div>
                    <img
                      src="/logo.png"
                      alt="Flinote"
                      className="h-10 w-auto rounded-md transition-opacity duration-200 opacity-100 group-hover:opacity-0 visible group-hover:invisible"
                    />
                  </div>
                  <SidebarTrigger className="absolute opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10 pointer-events-none group-hover:pointer-events-auto" />
                </div>
              ) : (
                <>
                  <div>
                    <img
                      src="/logo.png"
                      alt="Flinote"
                      className="h-10 w-auto mr-2 rounded-md"
                    />
                  </div>
                  <div className={`text-foreground flex-1 `}>
                    <div className="text-lg font-semibold leading-5">
                      Flinote
                    </div>
                    <div className="text-sm text-muted-foreground font-medium leading-4">
                      Smart Notes
                    </div>
                  </div>
                  <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10" />
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <nav>
              <ul
                className={cn(
                  "space-y-2 overflow-x-hidden",
                  isCollapsed && "flex flex-col items-center"
                )}
              >
                {dashboardItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-baseline px-4 py-3 rounded-[10px] transition-colors",
                          isCollapsed
                            ? "justify-center w-full"
                            : "w-full gap-3",
                          isActive
                            ? "dark:bg-[#202020] bg-neutral-100 dark:text-white text-black"
                            : "text-neutral-500 dark:text-[#909090] hover:bg-neutral-100/50 dark:hover:bg-[#202020]/50"
                        )}
                      >
                        <Icon className="size-[18px] shrink-0" />
                        {!isCollapsed && (
                          <span
                            className="leading-5 text-[16px] font-normal
													 "
                          >
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

          <div className="mt-auto space-y-4 overflow-x-hidden">
            {/* Theme Toggle - Show icon when collapsed */}
            {isCollapsed && mounted && (
              <button
                onClick={() => {
                  const newTheme = isDark ? "light" : "dark";
                  setTheme(newTheme);
                }}
                className="flex items-center justify-center w-full rounded-[10px] transition-all py-3 px-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 shrink-0" />
                ) : (
                  <Moon className="w-5 h-5 shrink-0" />
                )}
              </button>
            )}

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

            {/* Subscription Card - Show icon when collapsed */}
            {isCollapsed && !isLoadingSubscription && (
              <div className="flex justify-center">
                {hasActiveSubscription ? (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                ) : (
                  <Link
                    href="/pricing"
                    className="w-10 h-10 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/30 flex items-center justify-center transition-all"
                    aria-label="Upgrade to PRO"
                  >
                    <span className="text-lg">⚡</span>
                  </Link>
                )}
              </div>
            )}

            {!isCollapsed && (
              <SubscriptionCard
                hasActiveSubscription={hasActiveSubscription}
                isLoading={isLoadingSubscription}
                isDark={isDark}
              />
            )}

            {/* User Profile - Show icon when collapsed */}
            {isCollapsed && (
              <div className="flex justify-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <UserControl showName={false} />
              </div>
            )}

            {!isCollapsed && (
              <div className="mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <UserControl showName={true} />
              </div>
            )}
          </div>
        </div>
      </aside>
    </SidebarContext.Provider>
  );
}
