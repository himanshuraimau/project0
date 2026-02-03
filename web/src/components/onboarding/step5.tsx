"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";

const studyOptions = [
  {
    id: "light",
    emoji: "✅",
    label: "Light",
    duration: "10 min / day",
    color: "bg-green-50",
    emojiColor: "text-green-600",
  },
  {
    id: "regular",
    emoji: "🔥",
    label: "Regular",
    duration: "20 min / day",
    color: "bg-orange-50",
    emojiColor: "text-orange-600",
  },
  {
    id: "focused",
    emoji: "💪",
    label: "Focused",
    duration: "60 min / day",
    color: "bg-blue-50",
    emojiColor: "text-blue-600",
  },
  {
    id: "intense",
    emoji: "🚀",
    label: "Intense",
    duration: "120 min / day",
    color: "bg-purple-50",
    emojiColor: "text-purple-600",
  },
];

export function OnboardingStep5() {
  const [selected, setSelected] = useState<string>("light");
  const { saveStep, completeOnboarding, isLoading } = useOnboarding();
  const router = useRouter();

  const handleComplete = async () => {
    try {
      await saveStep(5, { studyIntensity: selected });
      await completeOnboarding();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-[#171717]">
      <div className="w-full max-w-2xl space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 text-[#0A0A0A] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1e1e1e]"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-[#606060] dark:text-gray-400">
            <span>Step 5 of 5</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-[#606060] dark:text-gray-400">
            Personalizing Flinote for you...
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            What&apos;s your study commitment?
          </h1>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {studyOptions.map((option) => (
            <Card
              key={option.id}
              className={`p-6 cursor-pointer transition-all bg-white dark:bg-[#1e1e1e] border border-[#E5E7EB] dark:border-gray-700 rounded-xl hover:shadow-lg hover:border-[#155DFC] dark:hover:border-[#155DFC] ${
                selected === option.id
                  ? "ring-2 ring-[#155DFC] border-[#155DFC] bg-[#155DFC]/5 dark:bg-[#155DFC]/10"
                  : ""
              }`}
              onClick={() => setSelected(option.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${option.color} dark:bg-[#155DFC]/20`}>
                  <span className={`text-3xl ${option.emojiColor} dark:text-[#155DFC]`}>
                    {option.emoji}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0A0A0A] dark:text-white">{option.label}</h3>
                  <p className="text-sm text-[#606060] dark:text-gray-400">
                    {option.duration}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Complete Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={isLoading}
            className="min-w-[200px] bg-[#155DFC] hover:bg-[#155DFC]/90 text-white"
          >
            {isLoading ? "Completing..." : "Get Started"}
          </Button>
        </div>
      </div>
    </div>
  );
}
