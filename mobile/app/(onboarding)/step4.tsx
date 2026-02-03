import React from 'react'
import OnboardingStep4 from '@/components/onboarding/OnboardingStep4'
import { useOnboarding } from '@/lib/contexts/OnboardingContext'
import { useRouter } from 'expo-router'

export default function Page() {
  const router = useRouter()
  const { saveStep } = useOnboarding()

  const handleContinue = async (features: string[]) => {
    await saveStep(4, { features })
    router.push('/(onboarding)/step5' as any)
  }

  return <OnboardingStep4 onContinue={handleContinue} />
}
