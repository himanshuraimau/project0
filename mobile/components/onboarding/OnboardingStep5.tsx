import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { ContinueButton } from '../ui/ContinueButton'
import { OnboardingOptionRow } from './OnboardingOptionRow'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const studyOptions = [
  {
    id: 'light',
    icon: <Ionicons name="leaf" size={20} color="#fff" />,
    iconBg: '#34C759',
    label: 'Light',
    subtitle: '10 min / day',
  },
  {
    id: 'regular',
    icon: <Ionicons name="flame" size={20} color="#fff" />,
    iconBg: '#FF9500',
    label: 'Regular',
    subtitle: '20 min / day',
  },
  {
    id: 'focused',
    icon: <Ionicons name="fitness" size={20} color="#fff" />,
    iconBg: '#FF3B30',
    label: 'Focused',
    subtitle: '60 min / day',
  },
  {
    id: 'intense',
    icon: <Ionicons name="flash" size={20} color="#fff" />,
    iconBg: '#AF52DE',
    label: 'Intense',
    subtitle: '90+ min / day',
  },
]

interface OnboardingStep5Props {
  onContinue?: (studyIntensity: string) => void
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
            icon={opt.icon}
            label={opt.label}
            subtitle={opt.subtitle}
            iconBackgroundColor={opt.iconBg}
            isSelected={selectedOption === opt.id}
            onPress={() => setSelectedOption(opt.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
