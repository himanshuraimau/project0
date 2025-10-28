import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { onboardingStyles as styles } from './onboarding-styles/onboarding-styles'

interface OptionButtonProps {
  icon: React.ReactNode
  label: string
  isSelected: boolean
  onPress: () => void
}

const OptionButton: React.FC<OptionButtonProps> = ({
  icon,
  label,
  isSelected,
  onPress,
}) => {
  return (
    <Pressable
      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.optionText}>{label}</Text>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark" size={20} color="#7C3AED" />
        </View>
      )}
    </Pressable>
  )
}

interface OnboardingStep1Props {
  onContinue?: () => void
}

export default function OnboardingStep1({ onContinue }: OnboardingStep1Props) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const options = [
    {
      id: 'instagram',
      icon: <Ionicons name="logo-instagram" size={24} color="#E1306C" />,
      label: 'Instagram Reels',
    },
    {
      id: 'tiktok',
      icon: <Ionicons name="logo-tiktok" size={24} color="#000000" />,
      label: 'TikTok',
    },
    {
      id: 'facebook',
      icon: <Ionicons name="logo-facebook" size={24} color="#1877F2" />,
      label: 'Facebook',
    },
    {
      id: 'appstore',
      icon: <Ionicons name="logo-apple" size={24} color="#000000" />,
      label: 'App Store',
    },
    {
      id: 'reddit',
      icon: <Ionicons name="logo-reddit" size={24} color="#FF4500" />,
      label: 'Reddit',
    },
    {
      id: 'chatgpt',
      icon: (
        <MaterialCommunityIcons name="brain" size={24} color="#10A37F" />
      ),
      label: 'ChatGPT',
    },
    {
      id: 'friends',
      icon: (
        <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
      ),
      label: 'From friends or family',
    },
    {
      id: 'other',
      icon: <Ionicons name="create-outline" size={24} color="#6B7280" />,
      label: 'Other',
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
          <Text style={styles.subHeadingOnboarding}>
            Personalizing Jellinote for you...
          </Text>
          <Text style={styles.mainHeadingOnboarding}>
            Where did you find us?
          </Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {options.map((option) => (
            <OptionButton
              key={option.id}
              icon={option.icon}
              label={option.label}
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

