import OnboardingStep3 from '@/components/onboarding/OnboardingStep3'
import { useOnboarding } from '@/lib/contexts/OnboardingContext'
import { useRouter } from 'expo-router'
import React from 'react'

export default function Step3Screen() {
  const router = useRouter()
  const { saveStep } = useOnboarding()

  const handleContinue = (selectedOption: string) => {
    // Map selected option id to onboarding route
    const routeMap: Record<string, string> = {
      professional: '/(onboarding)/workingProfessional',
      student: '/(onboarding)/student-flow',
      parent: '/(onboarding)/parent',
      teacher: '/(onboarding)/teacher-flow',
      administrator: '/(onboarding)/administrator-flow'
    }

    // Save role locally
    saveStep(3, { role: selectedOption })

    const target = routeMap[selectedOption] || '/(onboarding)/workingProfessional'
    // router.replace has a narrow union type for routes; cast to any to allow dynamic routing
    router.replace(target as any)
  }

  return <OnboardingStep3 onContinue={handleContinue} />
}

