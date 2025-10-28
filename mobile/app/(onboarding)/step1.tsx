import OnboardingStep1 from '@/components/onboarding/OnboardingStep1'
import { useRouter } from 'expo-router'
import React from 'react'

export default function Step1Screen() {
  const router = useRouter()

  const handleContinue = () => {
    router.push('/(onboarding)/step2')
  }

  return <OnboardingStep1 onContinue={handleContinue} />
}

