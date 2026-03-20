import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { OnboardingOptionRow } from '../OnboardingOptionRow'
import { OnboardingScreenShell } from '../OnboardingScreenShell'

const fields = [
  { id: 'business', emoji: '💼', label: 'Business / Tech' },
  { id: 'creative', emoji: '🎨', label: 'Creative & Media' },
  { id: 'education', emoji: '🎓', label: 'Education' },
  { id: 'finance', emoji: '💲', label: 'Finance' },
  { id: 'healthcare', emoji: '💖', label: 'Healthcare' },
  { id: 'legal', emoji: '⚖️', label: 'Legal' },
  { id: 'manager', emoji: '👥', label: 'Manager / Executive' },
  { id: 'public', emoji: '📦', label: 'Public Service' },
  { id: 'sales', emoji: '📈', label: 'Sales / Marketing' },
  { id: 'other', emoji: '⏩', label: 'Something else' },
]

export default function WorkingProfessional1() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    setSelected(id)
    setTimeout(() => {
      router.push('/(onboarding)/workingProfessional/workingProfessional2' as any)
    }, 300)
  }

  return (
    <OnboardingScreenShell
      currentStep={1}
      totalSteps={4}
      showBackButton
      subHeading="Personalizing for you"
      mainHeading="What field do you work in?"
    >
      <View style={{ gap: 10 }}>
        {fields.map((f, i) => (
          <OnboardingOptionRow
            key={f.id}
            icon={<Text style={{ fontSize: 22 }}>{f.emoji}</Text>}
            label={f.label}
            isSelected={selected === f.id}
            onPress={() => handleSelect(f.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
