import OnboardingStep3 from '@/components/onboarding/OnboardingStep3'
import { useRouter } from 'expo-router'
import React from 'react'

export default function Step3Screen() {
  const router = useRouter()

  const handleContinue = () => {
    // Mark onboarding as complete and navigate to home
    router.replace('/(drawer)/(home)')
  }

  return <OnboardingStep3 onContinue={handleContinue} />
}

