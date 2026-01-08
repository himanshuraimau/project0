"use client";

import { SettingsSidebar } from "./SettingsSidebar";
import { NotificationsCard } from "./NotificationsCard";

export function NotificationsContent() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#171717] flex">
      {/* Left Sidebar */}
      <SettingsSidebar activeItem="notifications" />

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <NotificationsCard />
        </div>
      </div>
    </div>
  );
}
