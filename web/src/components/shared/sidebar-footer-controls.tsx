"use client";

import React from "react";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { UserControl } from "@/components/user-control";
import { SidebarFooter, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Sun, Moon } from 'lucide-react';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface SidebarFooterControlsProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Standardized sidebar footer component with theme toggle and user profile.
 * This footer should be used across all sidebars for consistency.
 */
export function SidebarFooterControls({ className, children }: SidebarFooterControlsProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : false;

  return (
    <SidebarFooter 
      className={cn(
        "mt-auto border-t border-sidebar-border bg-sidebar",
        className
      )}
    >
      {/* Custom content from children (like upgrade button) */}
      {children && (
        <>
          <div className="px-2 py-2">{children}</div>
          <SidebarSeparator />
        </>
      )}

      {/* Theme Toggle and User Profile */}
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-3",
          isCollapsed ? "flex-col" : "flex-row justify-between"
        )}
      >
        {/* Theme Toggle */}
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "text-sidebar-foreground"
              )}
              aria-label="Toggle theme"
            >
              {mounted && (
                <>
                  {isDark ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-500" />
                  )}
                  <span>Switch mode</span>
                </>
              )}
              {!mounted && <div className="h-4 w-4" />}
            </button>
          </div>
        )}

        {isCollapsed && mounted && (
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-md p-2 hover:bg-sidebar-accent"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-blue-500" />
            )}
          </button>
        )}

        {/* User Profile */}
        <div className={cn(isCollapsed && "w-full flex justify-center")}>
          <UserControl showName={!isCollapsed} />
        </div>
      </div>
    </SidebarFooter>
  );
}

