import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

const OPTIONS = [
  { id: 'study', icon: '🎯', label: 'Help my child study better' },
  { id: 'meetings', icon: '🎤', label: 'Be more present in meetings' },
  { id: 'other', icon: '✏️', label: 'Something else' },
]

export default function Parent2() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <OnboardingScreenShell
      currentStep={2}
      totalSteps={5}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="What brings you to Flinote?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/parent/parent3' as any)}
          disabled={!selected}
        />
      }
    >
      <View style={{ gap: 10 }}>
        {OPTIONS.map((o, i) => (
          <OnboardingOptionRow
            key={o.id}
            icon={<Text style={{ fontSize: 20 }}>{o.icon}</Text>}
            label={o.label}
            isSelected={selected === o.id}
            onPress={() => setSelected(o.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
