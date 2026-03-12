import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { View } from 'react-native'
import { OnboardingOptionCard } from './OnboardingOptionCard'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const STAGGER = 50

const options = [
  { id: 'professional', emoji: '💼', title: 'Working professional', description: "I'm currently employed full or part time", accentColor: '#FEF3C7' },
  { id: 'student', emoji: '🍎', title: 'Student', description: 'Lectures, study notes, summaries, etc.', accentColor: '#FCE7F3' },
  { id: 'parent', emoji: '👶', title: 'Parent', description: "For my child's classes and activities", accentColor: '#F3E8FF' },
  { id: 'teacher', emoji: '✏️', title: 'Teacher', description: 'To record lectures, scribble notes, or other', accentColor: '#FEF3C7' },
  { id: 'administrator', emoji: '🏛️', title: 'Administrator', description: 'Trying Flinote for my school/district', accentColor: '#DBEAFE' },
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
      subHeading="Personalizing Flinote for you..."
      mainHeading="Which best describes you?"
    >
      <View style={{ gap: 16 }}>
        {options.map((opt, i) => (
          <OnboardingOptionCard
            key={opt.id}
            emoji={opt.emoji}
            title={opt.title}
            description={opt.description}
            accentColor={opt.accentColor}
            isSelected={selectedOption === opt.id}
            onPress={() => handleOptionSelect(opt.id)}
            entranceDelay={80 + i * STAGGER}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
