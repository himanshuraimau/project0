import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { ContinueButton } from '../../ui/ContinueButton'

export default function Student3() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'arts', icon: '🎨', label: 'Arts & Humanities', iconBg: '#FFEDD4' },
    { id: 'business', icon: '💼', label: 'Business & Economics', iconBg: '#FEF3C6' },
    { id: 'education', icon: '🎓', label: 'Education', iconBg: '#FFE2E2' },
    { id: 'engineering', icon: '⚙️', label: 'Engineering & Technology', iconBg: '#D1D5DC' },
    { id: 'health', icon: '❤️', label: 'Health & Medicine', iconBg: '#FFE2E2' },
    { id: 'law', icon: '⚖️', label: 'Law & Criminal Justice', iconBg: '#D1D5DC' },
    { id: 'sciences', icon: '🧪', label: 'Life & Physical Sciences', iconBg: '#DBEAFE' },
    { id: 'other', icon: '🌍', label: 'Other', iconBg: '#BEDBFF' },
  ]

  return (
    <OnboardingScreenShell
      currentStep={3}
      totalSteps={9}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="What is your major or primary area of study?"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/student-flow/student4' as any)}
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
