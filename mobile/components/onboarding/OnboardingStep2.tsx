import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { BlurGradient } from '../ui/BlurGradient'
import { onboardingStep2Styles as styles } from './onboarding-styles/onboarding-step2-styles'

interface OptionButtonProps {
  iconBackgroundColor: string
  icon: React.ReactNode
  label: string
  isSelected: boolean
  onPress: () => void
}

const OptionButton: React.FC<OptionButtonProps> = ({
  iconBackgroundColor,
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
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: iconBackgroundColor },
        ]}
      >
        {icon}
      </View>
      <Text style={styles.optionText}>{label}</Text>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark" size={20} color="#7C3AED" />
        </View>
      )}
    </Pressable>
  )
}

interface OnboardingStep2Props {
  onContinue?: (userType: string) => void
}

export default function OnboardingStep2({ onContinue }: OnboardingStep2Props) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
    // Navigate immediately when an option is clicked
    if (onContinue) {
      // Small delay for visual feedback (showing the selected state)
      setTimeout(() => {
        onContinue(optionId)
      }, 300)
    }
  }

  const options = [
    {
      id: 'just-me',
      iconBackgroundColor: '#E0F2F1',
      icon: <Ionicons name="person" size={28} color="#00695C" />,
      label: 'Just me',
    },
    {
      id: 'me-family',
      iconBackgroundColor: '#E0F2F1',
      icon: <Ionicons name="people" size={28} color="#00695C" />,
      label: 'Me + Family',
    },
    {
      id: 'someone-else',
      iconBackgroundColor: '#FFFBEB',
      icon: (
        <View style={styles.recordButton}>
          <View style={styles.recordButtonInner} />
        </View>
      ),
      label: 'Someone else (not me)',
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

      {/* Top Right Purple Blur Gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={286}
        height={256}
        left={254}
        top={-46}
        opacity={0.1}
      />

      {/* Top Left Purple Blur Gradient */}
      <BlurGradient
        colors={['#7C3AED', '#9810FA']}
        width={240}
        height={240}
        left={-130}
        top={270}
        opacity={0.1}
      />

      {/* Bottom Right Blue Blur Gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        left={215}
        top={661}
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
          <Text style={styles.subHeading}>
            Personalizing Flinote for you...
          </Text>
          <Text style={styles.mainHeading}>Who will use Flinote?</Text>
        </View>

        {/* Empty space in the middle */}
        <View style={styles.spacer} />

        {/* Options List - anchored at bottom */}
        <View style={styles.optionsList}>
          {options.map((option) => (
            <OptionButton
              key={option.id}
              iconBackgroundColor={option.iconBackgroundColor}
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

