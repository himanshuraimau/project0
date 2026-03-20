import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

export default function Student2() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'senior', icon: '🎓', label: 'Senior / 4th+ year', iconBg: '#DCFCE7' },
    { id: 'junior', icon: '🎓', label: 'Junior / 3rd year', iconBg: '#FFEDD4' },
    { id: 'sophomore', icon: '🎓', label: 'Soph / 2nd year', iconBg: '#DCFCE7' },
    { id: 'freshman', icon: '🌱', label: 'Freshman / 1st year', iconBg: '#DCFCE7' },
    { id: 'graduate', icon: '🎓', label: 'Graduate school', iconBg: '#FFEDD4' },
  ]

  return (
    <OnboardingScreenShell
      currentStep={2}
      totalSteps={9}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="What year are you in?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/student-flow/student3' as any)}
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
