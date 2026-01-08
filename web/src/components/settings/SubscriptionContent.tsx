"use client";

import { SettingsSidebar } from "./SettingsSidebar";
import { SubscriptionCard } from "./SubscriptionCard";

export function SubscriptionContent() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#171717] flex">
      {/* Left Sidebar */}
      <SettingsSidebar activeItem="subscription" />

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <SubscriptionCard />
        </div>
      </div>
    </div>
  );
}
