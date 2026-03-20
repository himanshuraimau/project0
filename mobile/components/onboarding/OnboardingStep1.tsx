import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, View } from 'react-native'
import { useTheme } from '@/lib/hooks/useTheme'
import { OnboardingOptionRow } from './OnboardingOptionRow'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const options = [
  { id: 'instagram', icon: (c: string) => <Ionicons name="logo-instagram" size={24} color={c} />, label: 'Instagram Reels' },
  { id: 'tiktok', icon: (c: string) => <Ionicons name="logo-tiktok" size={24} color={c} />, label: 'TikTok' },
  { id: 'facebook', icon: (c: string) => <Ionicons name="logo-facebook" size={24} color={c} />, label: 'Facebook' },
  { id: 'appstore', icon: (c: string) => <Ionicons name="logo-apple" size={24} color={c} />, label: 'App Store' },
  { id: 'reddit', icon: (c: string) => <Ionicons name="logo-reddit" size={24} color={c} />, label: 'Reddit' },
  {
    id: 'chatgpt',
    icon: () => <Image source={require('../../assets/images/chatgpt.png')} style={{ width: 24, height: 24 }} />,
    label: 'ChatGPT',
  },
  { id: 'friends', icon: (c: string) => <Ionicons name="chatbubble-outline" size={22} color={c} />, label: 'From friends or family' },
  { id: 'other', icon: (c: string) => <Ionicons name="create-outline" size={22} color={c} />, label: 'Other' },
]

interface OnboardingStep1Props {
  onContinue?: (source: string) => void
}

export default function OnboardingStep1({ onContinue }: OnboardingStep1Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const c = theme.colors
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
    if (onContinue) {
      setTimeout(() => onContinue(optionId), 320)
    } else {
      setTimeout(() => router.push('/(onboarding)/step2' as any), 320)
    }
  }

  return (
    <OnboardingScreenShell
      currentStep={1}
      totalSteps={5}
      subHeading="Personalizing for you"
      mainHeading="Where did you find us?"
      showBackButton={false}
    >
      <View style={{ gap: 10 }}>
        {options.map((opt, i) => (
          <OnboardingOptionRow
            key={opt.id}
            icon={opt.icon(c.mutedForeground)}
            label={opt.label}
            isSelected={selectedOption === opt.id}
            onPress={() => handleOptionSelect(opt.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
