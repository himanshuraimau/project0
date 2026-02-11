"use client";

import { SettingsSidebar } from "./SettingsSidebar";
import { ProfileCard } from "./ProfileCard";
import { PreferencesCard } from "./PreferencesCard";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface SettingsContentProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function SettingsContent({ user }: SettingsContentProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <SettingsSidebar
        activeItem="profile"
        onItemClick={(id) => {
          if (id === "logout") handleLogout();
        }}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 sm:px-8 sm:py-10">
          {/* Page header */}
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Profile & preferences
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Manage your account details and app preferences.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <ProfileCard user={user} />
            <PreferencesCard />
          </div>
        </div>
      </main>
    </div>
  );
}
