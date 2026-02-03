import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { saveOnboarding, completeOnboarding, OnboardingData } from '@/lib/api/onboarding';

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  saveStep: (step: number, stepData: Partial<OnboardingData>) => Promise<void>;
  completeOnboardingFlow: (studyIntensity: string) => Promise<void>;
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
    // Just update local state without API call for better performance
    updateData({ ...stepData, currentStep: step });
    console.log(`📝 Step ${step} data saved locally`);
  };

  const completeOnboardingFlow = async (studyIntensity: string) => {
    setIsLoading(true);
    try {
      console.log('🎉 Completing onboarding flow...');
      console.log('📤 Sending all onboarding data to backend...');
      
      const finalData = { 
        ...data, 
        studyIntensity,
        currentStep: 5,
        isCompleted: true 
      };
      
      // Save all data at once to backend
      await completeOnboarding(finalData);
      console.log('✅ Onboarding completed and saved to backend');
      
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
