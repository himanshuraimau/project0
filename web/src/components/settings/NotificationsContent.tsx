"use client";

import { SettingsSidebar } from "./SettingsSidebar";
import { NotificationsCard } from "./NotificationsCard";

export function NotificationsContent() {
  return (
    <div className="min-h-screen flex bg-background">
      <SettingsSidebar activeItem="notifications" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 sm:px-8 sm:py-10">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Choose how and when you want to be notified.
            </p>
          </header>

          <NotificationsCard />
        </div>
      </main>
    </div>
  );
}
