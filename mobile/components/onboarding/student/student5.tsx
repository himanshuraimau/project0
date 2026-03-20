import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

export default function Student5() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleContinue = () => {
    router.push('/(onboarding)/student-flow/student6' as any)
  }

  const OPTIONS = [
    { id: 'grades', icon: '🌱', label: 'Improve my grades', iconBg: '#FFE2E2' },
    { id: 'learn', icon: '📚', label: 'Learn 10x faster', iconBg: '#DCFCE7' },
    { id: 'focus', icon: '🎯', label: 'Focus better in class', iconBg: '#D1D5DC' },
    { id: 'details', icon: '✅', label: "Don't miss important details", iconBg: '#D1D5DC' },
    { id: 'other', icon: '✏️', label: 'Something else', iconBg: '#FEF3C6' },
  ]

  return (
    <OnboardingScreenShell
      currentStep={5}
      totalSteps={9}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="What's your main goal?"
      footer={
        <ContinueButton
          onPress={handleContinue}
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
