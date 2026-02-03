import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { saveOnboarding, completeOnboarding, OnboardingData } from '@/lib/api/onboarding';

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  saveStep: (step: number, stepData: Partial<OnboardingData>) => Promise<void>;
  completeOnboardingFlow: () => Promise<void>;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

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
      
      console.log(`💾 Saving onboarding step ${step} to backend...`);
      await saveOnboarding({
        ...stepData,
        currentStep: step,
        isCompleted: false,
      });
      console.log(`✅ Step ${step} saved successfully`);
    } catch (error) {
      console.error(`❌ Error saving onboarding step ${step}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboardingFlow = async () => {
    setIsLoading(true);
    try {
      console.log('🎉 Completing onboarding flow...');
      await completeOnboarding(data);
      console.log('✅ Onboarding completed successfully');
      
      // Redirect to home after completion
      router.replace('/(home)');
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{ data, updateData, saveStep, completeOnboardingFlow, isLoading }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
