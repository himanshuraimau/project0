"use client";

import { SettingsSidebar } from "./SettingsSidebar";
import { SupportPageContent } from "@/components/support/support-page-content";

export function SupportContent() {
  return (
    <div className="min-h-screen flex bg-background">
      <SettingsSidebar activeItem="support" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-10">
            <SupportPageContent />
          </div>
        </div>
      </main>
    </div>
  );
}
