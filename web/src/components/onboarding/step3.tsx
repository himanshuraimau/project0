"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";

const roles = [
  {
    id: "professional",
    emoji: "💼",
    title: "Working professional",
    description: "I'm currently employed full or part time",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    id: "student",
    emoji: "🍎",
    title: "Student",
    description: "Lectures, study notes, summaries, etc.",
    gradient: "from-red-400 to-pink-500",
  },
  {
    id: "parent",
    emoji: "👶",
    title: "Parent",
    description: "For my child's classes and activities",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    id: "teacher",
    emoji: "✏️",
    title: "Teacher",
    description: "To record lectures, scribble notes, or other",
    gradient: "from-orange-400 to-yellow-400",
  },
  {
    id: "administrator",
    emoji: "🏛️",
    title: "Administrator",
    description: "Trying Flinote for my school/district",
    gradient: "from-cyan-400 to-blue-500",
  },
];

export function OnboardingStep3() {
  const [selected, setSelected] = useState<string | null>(null);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const handleSelect = async (roleId: string) => {
    setSelected(roleId);

    try {
      await saveStep(3, { role: roleId });
      setTimeout(() => {
        router.push("/onboarding/step4");
      }, 300);
    } catch (error) {
      console.error("Failed to save step 3:", error);
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
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-[#606060] dark:text-gray-400">
            <span>Step 3 of 5</span>
            <span>60%</span>
          </div>
          <Progress value={60} className="h-2" />
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-[#606060] dark:text-gray-400">
            Personalizing Flinote for you...
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            Which best describes you?
          </h1>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`p-6 cursor-pointer transition-all bg-white dark:bg-[#1e1e1e] border border-[#E5E7EB] dark:border-gray-700 rounded-xl hover:shadow-lg hover:border-[#155DFC] dark:hover:border-[#155DFC] ${
                selected === role.id
                  ? "ring-2 ring-[#155DFC] border-[#155DFC] bg-[#155DFC]/5 dark:bg-[#155DFC]/10"
                  : ""
              }`}
              onClick={() => handleSelect(role.id)}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`p-4 rounded-2xl bg-gradient-to-br ${role.gradient} text-4xl`}
                >
                  {role.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0A0A0A] dark:text-white">{role.title}</h3>
                  <p className="text-sm text-[#606060] dark:text-gray-400">
                    {role.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
