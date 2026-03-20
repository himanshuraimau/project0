import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, View } from 'react-native'
import { ContinueButton } from '../ui/ContinueButton'
import { OnboardingFeatureCard } from './OnboardingFeatureCard'
import { OnboardingScreenShell } from './OnboardingScreenShell'

const features = [
  { id: 'record', icon: <Image source={require('../../assets/images/record-audio.png')} style={{ width: 52, height: 52 }} />, label: 'Record lectures' },
  { id: 'notes', icon: <Image source={require('../../assets/images/instant-notes.png')} style={{ width: 52, height: 52 }} />, label: 'Instant Notes' },
  { id: 'transcripts', icon: <Image source={require('../../assets/images/quick-transcripts.png')} style={{ width: 52, height: 52 }} />, label: 'Quick Transcripts' },
  { id: 'ai-chat', icon: <Image source={require('../../assets/images/chat-with-ai.png')} style={{ width: 52, height: 52 }} />, label: 'Chat with AI' },
  { id: 'quiz', icon: <Image source={require('../../assets/images/ai-quiz-tests.png')} style={{ width: 52, height: 52 }} />, label: 'AI Quiz Tests' },
  { id: 'flashcards', icon: <Image source={require('../../assets/images/flashcards.png')} style={{ width: 52, height: 52 }} />, label: 'Flashcards' },
]

interface OnboardingStep4Props {
  onContinue?: (features: string[]) => void
}

export default function OnboardingStep4({ onContinue }: OnboardingStep4Props) {
  const router = useRouter()
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue(selectedFeatures)
    } else {
      router.push('/(onboarding)/step5' as any)
    }
  }

  return (
    <OnboardingScreenShell
      currentStep={4}
      totalSteps={5}
      showBackButton
      subHeading="Personalizing for you"
      mainHeading="Which features will help you most?"
      footer={
        <ContinueButton
          onPress={handleContinue}
          disabled={selectedFeatures.length === 0}
        />
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        {features.map((f, i) => (
          <OnboardingFeatureCard
            key={f.id}
            icon={f.icon}
            label={f.label}
            isSelected={selectedFeatures.includes(f.id)}
            onPress={() => toggleFeature(f.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  )
}
