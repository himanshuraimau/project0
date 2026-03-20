import React, { useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

const options = [
  { id: 'organize', emoji: '🎯', label: 'Create and organize class notes faster' },
  { id: 'study', emoji: '✍️', label: 'Build study materials and quizzes' },
  { id: 'meetings', emoji: '📄', label: 'Capture insights from meetings' },
  { id: 'students', emoji: '📚', label: 'Support students beyond the classroom' },
  { id: 'other', emoji: '✏️', label: 'Something else' },
]

export default function Teacher2() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <OnboardingScreenShell
      currentStep={2}
      totalSteps={4}
      showBackButton
      subHeading="Personalizing for you"
      mainHeading="What would you like Flinote to help you with?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/teacher-flow/teacher3' as any)}
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
