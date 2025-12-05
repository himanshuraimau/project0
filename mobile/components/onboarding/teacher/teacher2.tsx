import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import styles from '../onboarding-styles/teacher2'

export default function Teacher2() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleContinue = () => {
    router.push('/(onboarding)/teacher-flow/teacher3' as any)
  }

  const options = [
    { id: 'organize', icon: '🎯', text: 'Create and organize class notes faster' },
    { id: 'study', icon: '✍️', text: 'Build study materials and quizzes' },
    { id: 'meetings', icon: '📄', text: 'Capture insights from meetings' },
    { id: 'students', icon: '📚', text: 'Support students beyond the classroom' },
    { id: 'other', icon: '✏️', text: 'Something else' },
  ]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#FFFFFF" />

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Main Question */}
        <Text style={styles.mainQuestion}>What would you like Jellinote to help you with?</Text>

        {/* Options Container */}
        <View style={styles.optionsContainer}>

          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                selectedOption === option.id && styles.optionButtonSelected,
              ]}
              onPress={() => setSelectedOption(option.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionText}>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <ContinueButton
          variant="gradient"
          onPress={handleContinue}
        />
      </View>
    </View>
  )
}

// styles imported from onboarding-styles/teacher2
