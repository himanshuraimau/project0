import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { onboardingStep3Styles as styles } from './onboarding-step3-styles'

interface OptionCardProps {
  emoji: string
  title: string
  description: string
  gradientColors: [string, string]
  isSelected: boolean
  onPress: () => void
}

const OptionCard: React.FC<OptionCardProps> = ({
  emoji,
  title,
  description,
  gradientColors,
  isSelected,
  onPress,
}) => {
  return (
    <Pressable
      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emojiSquircle}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </LinearGradient>
      <View style={styles.textContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
    </Pressable>
  )
}

interface OnboardingStep3Props {
  onContinue?: () => void
}

export default function OnboardingStep3({ onContinue }: OnboardingStep3Props) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const options: Array<{
    id: string
    emoji: string
    title: string
    description: string
    gradientColors: [string, string]
  }> = [
    {
      id: 'professional',
      emoji: '💼',
      title: 'Working professional',
      description: "I'm currently employed full or part time",
      gradientColors: ['#FDD835', '#FB8C00'],
    },
    {
      id: 'student',
      emoji: '🍎',
      title: 'Student',
      description: 'Lectures, study notes, summaries, etc.',
      gradientColors: ['#F48FB1', '#EC407A'],
    },
    {
      id: 'parent',
      emoji: '👶',
      title: 'Parent',
      description: "For my child's classes and activities",
      gradientColors: ['#AB47BC', '#EC407A'],
    },
    {
      id: 'teacher',
      emoji: '✏️',
      title: 'Teacher',
      description: 'To record lectures, scribble notes, or other',
      gradientColors: ['#FB8C00', '#FDD835'],
    },
    {
      id: 'administrator',
      emoji: '🏛️',
      title: 'Administrator',
      description: 'Trying Jellinote for my school/district',
      gradientColors: ['#4FC3F7', '#00BCD4'],
    },
  ]

  return (
    <LinearGradient
      colors={['#F7F5FF', '#F9FAFB']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.subHeading}>
            Personalizing Jellinote for you...
          </Text>
          <Text style={styles.mainHeading}>Which best describes you?</Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {options.map((option) => (
            <OptionCard
              key={option.id}
              emoji={option.emoji}
              title={option.title}
              description={option.description}
              gradientColors={option.gradientColors}
              isSelected={selectedOption === option.id}
              onPress={() => setSelectedOption(option.id)}
            />
          ))}
        </View>

        {/* Continue Button */}
        {selectedOption && (
          <View style={styles.continueButtonContainer}>
            <Pressable style={styles.continueButton} onPress={onContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  )
}

