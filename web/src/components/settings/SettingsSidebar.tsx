"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Globe,
  Bell,
  Headphones,
  CreditCard,
  Star,
} from "lucide-react";

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
});

const useSidebar = () => useContext(SidebarContext);

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

const settingsNavItems = [
  { title: "Profile", icon: User, href: "/settings", id: "profile" },
  { title: "Change Language", icon: Globe, href: "/settings/language", id: "language" },
  { title: "Notifications", icon: Bell, href: "/settings/notifications", id: "notifications" },
  { title: "Contact support", icon: Headphones, href: "/settings/support", id: "support", isButton: true },
  { title: "Subscription", icon: CreditCard, href: "/settings/subscription", id: "subscription" },
  { title: "Rate us", icon: Star, href: "/settings/rate", id: "rate", iconColor: "#F0B100" },
  { title: "Log out", icon: null, href: "/settings/logout", id: "logout", emoji: "👋" },
];

interface SettingsSidebarProps {
  className?: string;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const SidebarTrigger = ({ className }: { className?: string }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "flex items-center justify-center rounded-md transition-colors cursor-pointer",
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

export function SettingsSidebar({ className, activeItem = "profile", onItemClick }: SettingsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <aside
        className={cn(
          "h-screen transition-all duration-300 ease-in-out sticky top-0 flex flex-col",
          "dark:bg-[#1A1A1A] bg-[#F9FAFB]",
          "border-r border-neutral-200 dark:border-[#212121]",
          isCollapsed ? "w-[72px]" : "w-[285px]",
          className
        )}
      >
        <div className="w-full h-full py-5 px-[14px] flex flex-col overflow-hidden">
          {/* Back to Dashboard & Settings Title - Only show when not collapsed */}
          {!isCollapsed && (
            <div className="border-b-[0.8px] border-[#F1F5F9] dark:border-[#212121] pb-6 mb-4">
              {/* Back to Dashboard with Collapsible Button */}
              <div className="flex items-center justify-between mb-6">
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-[20px] h-[20px] text-[#45556C] dark:text-neutral-400" strokeWidth={1.67} />
                  <span className="text-[19px] font-bold text-[#45556C] dark:text-neutral-300 leading-6">
                    Back to Dashboard
                  </span>
                </Link>
                <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10" />
              </div>

              {/* Settings Title */}
              <h2 className="text-[19px] font-bold text-[#0F172B] dark:text-white leading-6">
                Settings
              </h2>
            </div>
          )}
          
          {/* Collapsible Button when sidebar is collapsed */}
          {isCollapsed && (
            <div className="mb-4 flex justify-center">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all text-lg w-10 h-10" />
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto">
            <ul
              className={cn(
                "space-y-2",
                isCollapsed && "flex flex-col items-center"
              )}
            >
              {settingsNavItems.map((item) => {
                const isActive = activeItem === item.id;
                const Icon = item.icon;
                
                const content = (
                  <div
                    className={cn(
                      "flex items-center rounded-[10px] transition-all cursor-pointer",
                      isCollapsed
                        ? "justify-center w-full px-4 py-3"
                        : "gap-3 px-4 h-12",
                      isActive
                        ? "bg-linear-to-r from-[#FAF5FF] to-[#EFF6FF] dark:from-purple-900/20 dark:to-blue-900/20"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                    )}
                  >
                    {item.emoji ? (
                      <span className="text-[24px] leading-8">{item.emoji}</span>
                    ) : Icon ? (
                      <Icon 
                        className="w-5 h-5 shrink-0" 
                        strokeWidth={1.67}
                        style={{ 
                          color: isActive ? "#8200DB" : (item.iconColor || "#45556C"),
                          stroke: isActive ? "#8200DB" : (item.iconColor || "#45556C")
                        }}
                      />
                    ) : null}
                    {!isCollapsed && (
                      <span 
                        className={`text-[16px] leading-6 ${
                          isActive 
                            ? "text-[#8200DB] dark:text-purple-400" 
                            : "text-[#101828] dark:text-neutral-300"
                        }`}
                      >
                        {item.title}
                      </span>
                    )}
                  </div>
                );

                return (
                  <li key={item.id}>
                    {item.id === "logout" || item.isButton ? (
                      <button
                        onClick={() => onItemClick?.(item.id)}
                        className="w-full text-left"
                      >
                        {content}
                      </button>
                    ) : (
                      <Link href={item.href}>
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Section - Privacy, Terms, Delete Account */}
          {!isCollapsed && (
            <div className="mt-auto flex flex-row justify-center items-center gap-6 h-[49px]">
              <Link href="/privacy" className="text-[14px] leading-5 text-[#99A1AF] dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-[14px] leading-5 text-[#99A1AF] dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Terms
              </Link>
              <button className="text-[14px] leading-5 text-[#99A1AF] dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                Delete Account
              </button>
            </div>
          )}
        </div>
      </aside>
    </SidebarContext.Provider>
  );
}
