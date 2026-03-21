import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, View } from 'react-native'
import { OnboardingOptionRow } from './OnboardingOptionRow'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const options = [
  {
    id: 'instagram',
    icon: <Ionicons name="logo-instagram" size={22} color="#fff" />,
    iconBg: '#E4405F',
    label: 'Instagram Reels',
  },
  {
    id: 'tiktok',
    icon: <Ionicons name="logo-tiktok" size={22} color="#fff" />,
    iconBg: '#010101',
    label: 'TikTok',
  },
  {
    id: 'facebook',
    icon: <Ionicons name="logo-facebook" size={22} color="#fff" />,
    iconBg: '#1877F2',
    label: 'Facebook',
  },
  {
    id: 'appstore',
    icon: <Ionicons name="logo-apple" size={22} color="#fff" />,
    iconBg: '#0D84FF',
    label: 'App Store',
  },
  {
    id: 'reddit',
    icon: <Ionicons name="logo-reddit" size={22} color="#fff" />,
    iconBg: '#FF4500',
    label: 'Reddit',
  },
  {
    id: 'chatgpt',
    icon: <Image source={require('../../assets/images/chatgpt.png')} style={{ width: 24, height: 24 }} />,
    iconBg: '#10A37F',
    label: 'ChatGPT',
  },
  {
    id: 'friends',
    icon: <Ionicons name="chatbubble" size={20} color="#fff" />,
    iconBg: '#34C759',
    label: 'From friends or family',
  },
  {
    id: 'other',
    icon: <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />,
    iconBg: '#8E8E93',
    label: 'Other',
  },
]

interface OnboardingStep1Props {
  onContinue?: (source: string) => void
}

export default function OnboardingStep1({ onContinue }: OnboardingStep1Props) {
  const router = useRouter()
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
