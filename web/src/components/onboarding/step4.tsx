"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mic, FileText, MessageSquare, Brain, GraduationCap, Lightbulb } from "lucide-react";

const features = [
  { id: "record", label: "Record lectures", icon: Mic },
  { id: "notes", label: "Instant Notes", icon: FileText },
  { id: "transcripts", label: "Quick Transcripts", icon: FileText },
  { id: "ai-chat", label: "Chat with AI", icon: MessageSquare },
  { id: "quiz", label: "AI Quiz Tests", icon: Brain },
  { id: "flashcards", label: "Flashcards", icon: GraduationCap },
];

export function OnboardingStep4() {
  const [selected, setSelected] = useState<string[]>([]);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const toggleFeature = (featureId: string) => {
    setSelected((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;

    try {
      await saveStep(4, { features: selected });
      router.push("/onboarding/step5");
    } catch (error) {
      console.error("Failed to save step 4:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-[#171717]">
      <div className="w-full max-w-3xl space-y-8">
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
            <span>Step 4 of 5</span>
            <span>80%</span>
          </div>
          <Progress value={80} className="h-2" />
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-[#606060] dark:text-gray-400">
            Personalizing Flinote for you...
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            Which part of Flinote will help you most?
          </h1>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isSelected = selected.includes(feature.id);
            return (
              <Card
                key={feature.id}
                className={`p-6 cursor-pointer transition-all bg-white dark:bg-[#1e1e1e] border border-[#E5E7EB] dark:border-gray-700 rounded-xl hover:shadow-lg hover:border-[#155DFC] dark:hover:border-[#155DFC] ${
                  isSelected
                    ? "ring-2 ring-[#155DFC] border-[#155DFC] bg-[#155DFC]/5 dark:bg-[#155DFC]/10"
                    : ""
                }`}
                onClick={() => toggleFeature(feature.id)}
              >
                <div className="flex flex-col items-center space-y-3 text-center">
                  <div className="p-4 rounded-xl bg-[#155DFC]/10 dark:bg-[#155DFC]/20">
                    <Icon className="w-8 h-8 text-[#155DFC]" />
                  </div>
                  <span className="font-medium text-sm text-[#0A0A0A] dark:text-white">{feature.label}</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={selected.length === 0}
            className="min-w-[200px] bg-[#155DFC] hover:bg-[#155DFC]/90 text-white"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
