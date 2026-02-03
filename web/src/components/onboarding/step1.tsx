"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Edit3,
  Smartphone
} from "lucide-react";

const sources = [
  { id: "instagram", label: "Instagram Reels", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Smartphone },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "appstore", label: "App Store", icon: Smartphone },
  { id: "reddit", label: "Reddit", icon: MessageCircle },
  { id: "chatgpt", label: "ChatGPT", icon: MessageCircle },
  { id: "friends", label: "From friends or family", icon: MessageCircle },
  { id: "other", label: "Other", icon: Edit3 },
];

export function OnboardingStep1() {
  const [selected, setSelected] = useState<string | null>(null);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const handleSelect = async (sourceId: string) => {
    setSelected(sourceId);
    
    try {
      await saveStep(1, { source: sourceId });
      setTimeout(() => {
        router.push("/onboarding/step2");
      }, 300);
    } catch (error) {
      console.error("Failed to save step 1:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-[#171717]">
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-[#606060] dark:text-gray-400">
            <span>Step 1 of 5</span>
            <span>20%</span>
          </div>
          <Progress value={20} className="h-2" />
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-[#606060] dark:text-gray-400">
            Personalizing Flinote for you...
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            How did you hear about Flinote?
          </h1>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4">
          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <Card
                key={source.id}
                className={`p-6 cursor-pointer transition-all bg-white dark:bg-[#1e1e1e] border border-[#E5E7EB] dark:border-gray-700 rounded-xl hover:shadow-lg hover:border-[#155DFC] dark:hover:border-[#155DFC] ${
                  selected === source.id
                    ? "ring-2 ring-[#155DFC] border-[#155DFC]"
                    : ""
                }`}
                onClick={() => handleSelect(source.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-[#155DFC]/10 dark:bg-[#155DFC]/20">
                    <Icon className="w-6 h-6 text-[#155DFC]" />
                  </div>
                  <span className="font-medium text-[#0A0A0A] dark:text-white">{source.label}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
