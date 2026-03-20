import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

const OPTIONS = [
  { id: 'child', icon: '✅', label: 'My child' },
  { id: 'both', icon: '✏️', label: 'Both of us' },
]

export default function Parent3() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <OnboardingScreenShell
      currentStep={3}
      totalSteps={5}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="Who is Flinote for?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/parent/parent4' as any)}
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
