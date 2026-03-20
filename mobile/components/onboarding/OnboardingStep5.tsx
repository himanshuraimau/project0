import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { ContinueButton } from '../ui/ContinueButton'
import { OnboardingOptionRow } from './OnboardingOptionRow'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const studyOptions = [
  { id: 'light', emoji: '✅', label: 'Light', subtitle: '10 min / day' },
  { id: 'regular', emoji: '🔥', label: 'Regular', subtitle: '20 min / day' },
  { id: 'focused', emoji: '💪', label: 'Focused', subtitle: '60 min / day' },
  { id: 'intense', emoji: '⚡', label: 'Intense', subtitle: '90+ min / day' },
]

interface OnboardingStep5Props {
  onContinue?: (studyIntensity: string) => void
}

function EmojiIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>
}

export default function OnboardingStep5({ onContinue }: OnboardingStep5Props) {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string>('light')

  const handleContinue = () => {
    if (onContinue) {
      onContinue(selectedOption)
    } else {
      router.push('/(onboarding)/paywall/paywall1' as any)
    }
  }

  return (
    <OnboardingScreenShell
      currentStep={5}
      totalSteps={5}
      showBackButton
      subHeading="Almost done"
      mainHeading="How much time do you study each day?"
      footer={<ContinueButton onPress={handleContinue} />}
    >
      <View style={{ gap: 10 }}>
        {studyOptions.map((opt, i) => (
          <OnboardingOptionRow
            key={opt.id}
            icon={<EmojiIcon emoji={opt.emoji} />}
            label={opt.label}
            subtitle={opt.subtitle}
            isSelected={selectedOption === opt.id}
            onPress={() => setSelectedOption(opt.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
