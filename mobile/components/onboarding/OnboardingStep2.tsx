import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { View } from 'react-native'
import { OnboardingOptionRow } from './OnboardingOptionRow'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const options = [
  {
    id: 'just-me',
    iconBg: '#007AFF',
    icon: <Ionicons name="person" size={22} color="#fff" />,
    label: 'Just me',
  },
  {
    id: 'me-family',
    iconBg: '#5856D6',
    icon: <Ionicons name="people" size={22} color="#fff" />,
    label: 'Me + Family',
  },
  {
    id: 'someone-else',
    iconBg: '#FF9500',
    icon: <Ionicons name="gift" size={22} color="#fff" />,
    label: 'Someone else (not me)',
  },
]

interface OnboardingStep2Props {
  onContinue?: (userType: string) => void
}

export default function OnboardingStep2({ onContinue }: OnboardingStep2Props) {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
    if (onContinue) {
      setTimeout(() => onContinue(optionId), 320)
    } else {
      setTimeout(() => router.push('/(onboarding)/step3' as any), 320)
    }
  }

  return (
    <OnboardingScreenShell
      currentStep={2}
      totalSteps={5}
      showBackButton
      subHeading="Personalizing for you"
      mainHeading="Who will use Flinote?"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
    >
      <View style={{ gap: 12, marginTop: 24 }}>
        {options.map((opt, i) => (
          <OnboardingOptionRow
            key={opt.id}
            icon={opt.icon}
            label={opt.label}
            iconBackgroundColor={opt.iconBg}
            isSelected={selectedOption === opt.id}
            onPress={() => handleOptionSelect(opt.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
