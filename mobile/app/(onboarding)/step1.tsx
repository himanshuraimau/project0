import OnboardingStep1 from '@/components/onboarding/OnboardingStep1'
import { useRouter } from 'expo-router'
import React from 'react'
import { useOnboarding } from '@/lib/contexts/OnboardingContext'

export default function Step1Screen() {
  const router = useRouter()
  const { saveStep } = useOnboarding()

  const handleContinue = (source: string) => {
    saveStep(1, { source })
    router.push('/(onboarding)/step2')
  }

  return <OnboardingStep1 onContinue={handleContinue} />
}
