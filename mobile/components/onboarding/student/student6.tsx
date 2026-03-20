import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

export default function Student6() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'class', icon: '📗', label: 'Yes, a specific class', iconBg: '#DCFCE7' },
    { id: 'exam', icon: '📓', label: 'Yes, an upcoming exam', iconBg: '#FFE2E2' },
    { id: 'else', icon: '👀', label: 'Yes, something else', iconBg: '#F3F4F6' },
    { id: 'general', icon: '📝', label: 'No, just generally help me', iconBg: '#FCE7F3' },
  ]

  return (
    <OnboardingScreenShell
      currentStep={6}
      totalSteps={9}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="Do you want us to focus on a class or an exam?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/student-flow/student7' as any)}
          disabled={!selected}
        />
      }
    >
      <View style={styles.options}>
        {OPTIONS.map((o, i) => (
          <OnboardingOptionRow
            key={o.id}
            icon={<Text style={styles.emoji}>{o.icon}</Text>}
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
