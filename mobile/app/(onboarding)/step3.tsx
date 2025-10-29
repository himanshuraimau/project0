import OnboardingStep3 from '@/components/onboarding/OnboardingStep3'
import { useRouter } from 'expo-router'
import React from 'react'

export default function Step3Screen() {
  const router = useRouter()

  const handleContinue = (selectedOption?: string) => {
    // Map selected option id to onboarding route
    const routeMap: Record<string, string> = {
      professional: '/(onboarding)/workingProfessional',
      student: '/(onboarding)/teacher-flow',
      parent: '/(onboarding)/parent',
      teacher: '/(onboarding)/teacher-flow',
      administrator: '/(onboarding)/administrator',
    }

    const target = (selectedOption && routeMap[selectedOption]) || '/(onboarding)/workingProfessional'
    // router.replace has a narrow union type for routes; cast to any to allow dynamic routing
    router.replace(target as any)
  }

  return <OnboardingStep3 onContinue={handleContinue} />
}

