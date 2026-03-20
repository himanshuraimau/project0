import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

const OPTIONS = [
  { id: 'class', icon: '📗', label: 'Yes, a specific class' },
  { id: 'exam', icon: '📓', label: 'Yes, an upcoming exam' },
  { id: 'other', icon: '👀', label: 'Yes, something else' },
  { id: 'general', icon: '📝', label: 'No, just generally help me' },
]

export default function Parent5() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <OnboardingScreenShell
      currentStep={5}
      totalSteps={5}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="Do you want us to focus on a class or an exam?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/step4' as any)}
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
