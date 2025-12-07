import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

/**
 * Check if the user has completed onboarding
 * @returns Promise<boolean> - true if onboarding is completed
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 */
export const markOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    console.log('✅ Onboarding marked as completed');
  } catch (error) {
    console.error('Error marking onboarding as completed:', error);
    throw error;
  }
};

/**
 * Reset onboarding completion status (useful for testing/debugging)
 */
export const resetOnboardingStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    console.log('🔄 Onboarding status reset');
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    throw error;
  }
};