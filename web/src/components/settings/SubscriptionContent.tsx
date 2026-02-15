"use client";

import { SettingsSubscriptionProvider } from "@/contexts/settings-subscription-context";
import { SettingsSidebar } from "./SettingsSidebar";
import { SubscriptionCard } from "./SubscriptionCard";

export function SubscriptionContent() {
  return (
    <SettingsSubscriptionProvider>
      <div className="min-h-screen flex bg-background">
        <SettingsSidebar activeItem="subscription" />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 sm:px-8 sm:py-10">
            <header className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Subscription
              </h1>
              <p className="mt-1.5 text-muted-foreground">
                Manage your plan and billing.
              </p>
            </header>

            <SubscriptionCard />
          </div>
        </main>
      </div>
    </SettingsSubscriptionProvider>
  );
}
