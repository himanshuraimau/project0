import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Platform, Pressable, ScrollView, StatusBar, Text, View, StyleSheet } from 'react-native'

interface StudyOptionProps {
  icon: React.ReactNode
  iconBgColor: string
  label: string
  duration: string
  isSelected: boolean
  onPress: () => void
}

const StudyOption: React.FC<StudyOptionProps> = ({
  icon,
  iconBgColor,
  label,
  duration,
  isSelected,
  onPress,
}) => {
  return (
    <Pressable
      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionDuration}>{duration}</Text>
      </View>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={28} color="#7C3AED" />
        </View>
      )}
    </Pressable>
  )
}

interface OnboardingStep5Props {
  onContinue?: () => void
}

export default function OnboardingStep5({ onContinue }: OnboardingStep5Props) {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string>('light')

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else {
      router.replace('/(onboarding)/paywall/paywall1' as any)
    }
  }

  const studyOptions = [
    {
      id: 'light',
      icon: <Ionicons name="checkbox" size={24} color="#FFFFFF" />,
      iconBgColor: '#10B981',
      label: 'Light',
      duration: '10 min / day',
    },
    {
      id: 'regular',
      icon: <Ionicons name="flame" size={24} color="#FFFFFF" />,
      iconBgColor: '#EF4444',
      label: 'Regular',
      duration: '20 min / day',
    },
    {
      id: 'focused',
      icon: <MaterialCommunityIcons name="arm-flex" size={24} color="#FFFFFF" />,
      iconBgColor: '#F59E0B',
      label: 'Focused',
      duration: '60 min / day',
    },
    {
      id: 'intense',
      icon: <Ionicons name="flash" size={24} color="#FFFFFF" />,
      iconBgColor: '#10B981',
      label: 'Intense',
      duration: '90+ min / day',
    },
  ]

  return (
    <LinearGradient
      colors={['#F7F5FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>4:22</Text>
          </View>
        </View>
        <View style={styles.statusRight}>
          <Ionicons name="wifi" size={16} color="#000000" style={{ marginRight: 4 }} />
          <Ionicons name="battery-full" size={20} color="#000000" />
        </View>
      </View>

      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000000" />
        </Pressable>
      </View>

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

        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.subTitle}>Personalizing Jellinote for you...</Text>
          <Text style={styles.mainTitle}>
            How much time do you want to study each day?
          </Text>
        </View>

        {/* Study Options List */}
        <View style={styles.optionsList}>
          {studyOptions.map((option) => (
            <StudyOption
              key={option.id}
              icon={option.icon}
              iconBgColor={option.iconBgColor}
              label={option.label}
              duration={option.duration}
              isSelected={selectedOption === option.id}
              onPress={() => setSelectedOption(option.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#000000" style={{ marginLeft: 8 }} />
        </Pressable>
        
        {/* iOS Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 20,
  },
  titleContainer: {
    marginBottom: 28,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A78BFA',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 36,
  },
  optionsList: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  homeIndicator: {
    height: 4,
    width: 140,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
})
