import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { View } from 'react-native'
import { OnboardingOptionRow } from './OnboardingOptionRow'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const options = [
  {
    id: 'just-me',
    iconBackgroundColor: '#E0F2F1',
    icon: <Ionicons name="person" size={28} color="#00695C" />,
    label: 'Just me',
  },
  {
    id: 'me-family',
    iconBackgroundColor: '#E0F2F1',
    icon: <Ionicons name="people" size={28} color="#00695C" />,
    label: 'Me + Family',
  },
  {
    id: 'someone-else',
    iconBackgroundColor: '#FFFBEB',
    icon: (
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#DC2626' }} />
    ),
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
            iconBackgroundColor={opt.iconBackgroundColor}
            isSelected={selectedOption === opt.id}
            onPress={() => handleOptionSelect(opt.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
