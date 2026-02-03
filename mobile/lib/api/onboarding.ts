import apiClient from './client';

export interface OnboardingData {
  source?: string;
  userType?: string;
  role?: string;
  features?: string[];
  studyIntensity?: string;
}

export interface OnboardingResponse {
  onboarding: {
    id: string;
    isCompleted: boolean;
    currentStep: number;
    source?: string;
    userType?: string;
    role?: string;
    features?: any;
    studyIntensity?: string;
    completedAt?: string;
  } | null;
}

/**
 * Check if user has completed onboarding (from backend)
 */
export const checkOnboardingStatus = async (): Promise<OnboardingResponse> => {
  try {
    const response = await apiClient.get<OnboardingResponse>('/onboarding');
    return response.data;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    throw error;
  }
};

/**
 * Save onboarding progress or complete onboarding
 */
export const saveOnboarding = async (data: OnboardingData & { 
  currentStep?: number; 
  isCompleted?: boolean 
}): Promise<{ success: boolean; onboarding: any }> => {
  try {
    const response = await apiClient.post('/onboarding', data);
    return response.data;
  } catch (error) {
    console.error('Error saving onboarding:', error);
    throw error;
  }
};

/**
 * Complete onboarding (mark as done)
 */
export const completeOnboarding = async (data: OnboardingData): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.post('/onboarding', {
      ...data,
      isCompleted: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
};
