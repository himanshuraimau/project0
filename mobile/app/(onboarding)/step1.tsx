import OnboardingStep1 from '@/components/onboarding/OnboardingStep1'
import { useRouter } from 'expo-router'
import React from 'react'
import { useOnboarding } from '@/lib/contexts/OnboardingContext'

export default function Step1Screen() {
  const router = useRouter()
  const { saveStep } = useOnboarding()

  const handleContinue = async (source: string) => {
    try {
      await saveStep(1, { source })
      router.push('/(onboarding)/step2')
    } catch (error) {
      console.error('Failed to save step 1:', error)
      // Still navigate even if save fails
      router.push('/(onboarding)/step2')
    }
  }

  return <OnboardingStep1 onContinue={handleContinue} />
}
