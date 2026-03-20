import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

export default function Student1() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'college', icon: '🏛️', label: 'College / University', iconBg: '#DCFCE7' },
    { id: 'highschool', icon: '🏫', label: 'High school', iconBg: '#DBEAFE' },
    { id: 'middleschool', icon: '📚', label: 'Middle school or earlier', iconBg: '#DCFCE7' },
    { id: 'trade', icon: '🎓', label: 'Trade or professional school', iconBg: '#FFE2E2' },
    { id: 'other', icon: '✏️', label: 'Something else', iconBg: '#FFEDD4' },
  ]

  return (
    <OnboardingScreenShell
      currentStep={1}
      totalSteps={9}
      showBackButton={false}
      subHeading="Personalizing Flinote for you..."
      mainHeading="Where are you in school?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/student-flow/student2' as any)}
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
