import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { BlurGradient } from '../ui/BlurGradient'
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

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
    // Navigate immediately when an option is clicked
    if (onContinue) {
      // Small delay for visual feedback (showing the selected state)
      setTimeout(() => {
        onContinue()
      }, 300)
    }
  }

  const options = [
    {
      id: 'instagram',
      icon: <Ionicons name="logo-instagram" size={24} color=" " />,
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

      {/* Top Right Blur Gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={286}
        height={256}
        right={-98}
        top={-47}
        opacity={0.1}
      />

      {/* Bottom Right Blur Gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        right={-80}
        bottom={-56}
        opacity={0.1}
      />

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
              onPress={() => handleOptionSelect(option.id)}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

