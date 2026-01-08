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
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#171717] flex">
      {/* Left Sidebar */}
      <SettingsSidebar activeItem="profile" onItemClick={(id) => {
        if (id === "logout") {
          handleLogout();
        }
      }} />

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Profile Card */}
            <ProfileCard user={user} />

            {/* Right Column - Preferences Card */}
            <PreferencesCard />
          </div>
        </div>
      </div>
    </div>
  );
}
