import React, { useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

const options = [
  { id: 'meetings', emoji: '🎯', label: 'Streamline and organize meeting notes' },
  { id: 'reports', emoji: '✍️', label: 'Generate reports, AI summaries' },
  { id: 'faculty', emoji: '📄', label: 'Support faculty and classroom initiatives' },
  { id: 'conversations', emoji: '📚', label: 'Keep track of important conversations' },
  { id: 'other', emoji: '✏️', label: 'Something else' },
]

export default function Administrator2() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <OnboardingScreenShell
      currentStep={2}
      totalSteps={3}
      showBackButton
      subHeading="Personalizing Flinote for you..."
      mainHeading="What would you like Flinote to help you with?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/administrator-flow/administrator3' as any)}
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
