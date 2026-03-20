import React, { useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

const options = [
  { id: 'class', emoji: '📗', label: 'Yes, a specific class', iconBg: '#DCFCE7' },
  { id: 'exam', emoji: '📑', label: 'Yes, an upcoming exam', iconBg: '#FFE2E2' },
  { id: 'other', emoji: '👀', label: 'Yes, something else', iconBg: '#F3F4F6' },
  { id: 'general', emoji: '📝', label: 'No, just generally help me', iconBg: '#FCE7F3' },
]

export default function Teacher4() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <OnboardingScreenShell
      currentStep={4}
      totalSteps={4}
      showBackButton
      subHeading="Personalizing Flinote for you..."
      mainHeading="Do you want us to focus on a class or an exam?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/step4' as any)}
          disabled={!selected}
        />
      }
    >
      <View style={styles.options}>
        {options.map((o, i) => (
          <OnboardingOptionRow
            key={o.id}
            icon={<Text style={styles.emoji}>{o.emoji}</Text>}
            label={o.label}
            isSelected={selected === o.id}
            onPress={() => setSelected(o.id)}
            index={i}
            iconBackgroundColor={o.iconBg}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}

const styles = StyleSheet.create({
  options: {
    gap: 10,
  },
  emoji: {
    fontSize: 20,
  },
})
