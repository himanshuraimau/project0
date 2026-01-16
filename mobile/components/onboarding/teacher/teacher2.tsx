import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { OptionButton } from '../../ui/OptionButton'
import styles from '../onboarding-styles/teacher2'

export default function Teacher2() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleContinue = () => {
    router.push('/(onboarding)/teacher-flow/teacher3' as any)
  }

  const options = [
    { id: 'organize', icon: '🎯', text: 'Create and organize class notes faster', iconBg: '#FFFFFF' },
    { id: 'study', icon: '✍️', text: 'Build study materials and quizzes', iconBg: '#FFFFFF' },
    { id: 'meetings', icon: '📄', text: 'Capture insights from meetings', iconBg: '#FFFFFF' },
    { id: 'students', icon: '📚', text: 'Support students beyond the classroom', iconBg: '#FFFFFF' },
    { id: 'other', icon: '✏️', text: 'Something else', iconBg: '#FFFFFF' },
  ]

  return (
    <SafeAreaView style={styles.container}>


      {/* Top blur gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={241}
        top={-111}
      />

      {/* Bottom blur gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-72}
        top={235}
      />

      {/* Header with back and progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#000000" style={{ marginRight: 12 }} />
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Main Question */}
        <Text style={styles.mainQuestion}>What would you like Flinote to help you with?</Text>

        {/* Options Container */}
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <OptionButton
              key={option.id}
              icon={option.icon}
              label={option.text}
              iconBg={option.iconBg}
              selected={selectedOption === option.id}
              onPress={() => setSelectedOption(option.id)}
              style={styles.optionOverride}
            />
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <ContinueButton
          onPress={handleContinue}
          disabled={!selectedOption}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/teacher2
