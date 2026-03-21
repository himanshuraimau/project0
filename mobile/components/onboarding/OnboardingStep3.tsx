import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { View } from 'react-native'
import { OnboardingOptionCard } from './OnboardingOptionCard'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const options = [
  {
    id: 'professional',
    emoji: '\uD83D\uDCBC',
    title: 'Working professional',
    description: "I'm currently employed full or part time",
    accentColor: '#FFF3E0',
  },
  {
    id: 'student',
    emoji: '\uD83C\uDF4E',
    title: 'Student',
    description: 'Lectures, study notes, summaries, etc.',
    accentColor: '#FFE0E6',
  },
  {
    id: 'parent',
    emoji: '\uD83D\uDC76',
    title: 'Parent',
    description: "For my child's classes and activities",
    accentColor: '#EDE7F6',
  },
  {
    id: 'teacher',
    emoji: '\u270F\uFE0F',
    title: 'Teacher',
    description: 'To record lectures, scribble notes, or other',
    accentColor: '#E3F2FD',
  },
  {
    id: 'administrator',
    emoji: '\uD83C\uDFDB\uFE0F',
    title: 'Administrator',
    description: 'Trying Flinote for my school/district',
    accentColor: '#E8F5E9',
  },
]

interface OnboardingStep3Props {
  onContinue?: (selectedOption: string) => void
}

export default function OnboardingStep3({ onContinue }: OnboardingStep3Props) {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
    if (onContinue) {
      setTimeout(() => onContinue(optionId), 320)
    } else {
      setTimeout(() => router.push('/(onboarding)/step4' as any), 320)
    }
  }

  return (
    <OnboardingScreenShell
      currentStep={3}
      totalSteps={5}
      showBackButton
      subHeading="Personalizing for you"
      mainHeading="Which best describes you?"
    >
      <View style={{ gap: 10 }}>
        {options.map((opt, i) => (
          <OnboardingOptionCard
            key={opt.id}
            emoji={opt.emoji}
            title={opt.title}
            description={opt.description}
            accentColor={opt.accentColor}
            isSelected={selectedOption === opt.id}
            onPress={() => handleOptionSelect(opt.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
