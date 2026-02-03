"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface OnboardingData {
  source?: string;
  userType?: string;
  role?: string;
  features?: string[];
  studyIntensity?: string;
  currentStep?: number;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  saveStep: (step: number, stepData: Partial<OnboardingData>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const saveStep = async (step: number, stepData: Partial<OnboardingData>) => {
    setIsLoading(true);
    try {
      updateData(stepData);
      
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...stepData,
          currentStep: step,
          isCompleted: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save onboarding step");
      }
    } catch (error) {
      console.error("Error saving onboarding step:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          isCompleted: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      // Redirect to dashboard after completion
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{ data, updateData, saveStep, completeOnboarding, isLoading }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
