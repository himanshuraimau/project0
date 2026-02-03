"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, Users, UserCircle } from "lucide-react";
import { ArrowLeft } from "lucide-react";

const userTypes = [
  {
    id: "just-me",
    label: "Just me",
    icon: User,
    color: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    id: "me-family",
    label: "Me + Family",
    icon: Users,
    color: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    id: "someone-else",
    label: "Someone else (not me)",
    icon: UserCircle,
    color: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

export function OnboardingStep2() {
  const [selected, setSelected] = useState<string | null>(null);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const handleSelect = async (userTypeId: string) => {
    setSelected(userTypeId);

    try {
      await saveStep(2, { userType: userTypeId });
      setTimeout(() => {
        router.push("/onboarding/step3");
      }, 300);
    } catch (error) {
      console.error("Failed to save step 2:", error);
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
            <span>Step 2 of 5</span>
            <span>40%</span>
          </div>
          <Progress value={40} className="h-2" />
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-[#606060] dark:text-gray-400">
            Personalizing Flinote for you...
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            Who will use Flinote?
          </h1>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {userTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className={`p-6 cursor-pointer transition-all bg-white dark:bg-[#1e1e1e] border border-[#E5E7EB] dark:border-gray-700 rounded-xl hover:shadow-lg hover:border-[#155DFC] dark:hover:border-[#155DFC] ${
                  selected === type.id
                    ? "ring-2 ring-[#155DFC] border-[#155DFC]"
                    : ""
                }`}
                onClick={() => handleSelect(type.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-4 rounded-lg ${type.color} dark:bg-[#155DFC]/20`}>
                    <Icon className={`w-7 h-7 ${type.iconColor} dark:text-[#155DFC]`} />
                  </div>
                  <span className="text-lg font-medium text-[#0A0A0A] dark:text-white">{type.label}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
