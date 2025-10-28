import OnboardingStep2 from '@/components/onboarding/OnboardingStep2'
import { useRouter } from 'expo-router'
import React from 'react'

export default function Step2Screen() {
  const router = useRouter()

  const handleContinue = () => {
    router.push('/(onboarding)/step3')
  }

  return <OnboardingStep2 onContinue={handleContinue} />
}

