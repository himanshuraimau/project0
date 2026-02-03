import OnboardingStep2 from '@/components/onboarding/OnboardingStep2'
import { useRouter } from 'expo-router'
import React from 'react'
import { useOnboarding } from '@/lib/contexts/OnboardingContext'

export default function Step2Screen() {
  const router = useRouter()
  const { saveStep } = useOnboarding()

  const handleContinue = (userType: string) => {
    saveStep(2, { userType })
    router.push('/(onboarding)/step3')
  }

  return <OnboardingStep2 onContinue={handleContinue} />
}
