"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Folder,
  BookOpen,
  Share2,
  Settings,
  ArrowLeft,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NoteAppSidebarProps {
  className?: string;
  noteId?: string;
}

export function NoteAppSidebar({ className, noteId }: NoteAppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "h-screen bg-white dark:bg-[#1A1A1A] border-r border-neutral-200 dark:border-[#212121]",
        className
      )}
    >
      {/* Brand Header */}
      <SidebarHeader className="px-4 py-5 border-b border-transparent">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0">
            <img
              src="/logo.png"
              alt="Jellinote AI"
              className="h-8 w-8 rounded-md"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-foreground leading-none">
                Jellinote AI
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Smart Notes
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={handleBackNavigation}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-foreground",
              isCollapsed && "justify-center px-0 w-10 h-10 mx-auto"
            )}
            title={isChildPage ? "Back to Notes" : "Back to Dashboard"}
          >
            <ArrowLeft className="h-4 w-4" />
            {!isCollapsed && (
              <span>{isChildPage ? "Back to Notes" : "Back to Dashboard"}</span>
            )}
          </button>
        </div>

        {/* Navigation List */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer User Card */}
      <SidebarFooter className="p-4 border-t border-neutral-200 dark:border-[#212121]">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src="/avatar-placeholder.png" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-foreground">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">2 / 3 Notes free</p>
            </div>
          )}
          {!isCollapsed && (
             <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground">
               <Settings className="h-4 w-4" />
             </Link>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

