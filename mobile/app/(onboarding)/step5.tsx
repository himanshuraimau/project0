import React from 'react'
import OnboardingStep5 from '@/components/onboarding/OnboardingStep5'
import { useOnboarding } from '@/lib/contexts/OnboardingContext'
import { useRouter } from 'expo-router'

export default function Page() {
  const router = useRouter()
  const { completeOnboardingFlow } = useOnboarding()

  const handleContinue = async (studyIntensity: string) => {
    // Complete onboarding with the final step data
    await completeOnboardingFlow({ studyIntensity })
    // Navigate to home after successful completion
    router.replace('/(home)' as any)
  }

  return <OnboardingStep5 onContinue={handleContinue} />
}
