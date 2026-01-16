import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native'
import { ContinueButton } from '../ui/ContinueButton'

interface StudyOptionProps {
  icon: React.ReactNode
  label: string
  duration: string
  isSelected: boolean
  onPress: () => void
}

const StudyOption: React.FC<StudyOptionProps> = ({
  icon,
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
      <View style={styles.iconCircle}>
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
      router.push('/(onboarding)/paywall/paywall1' as any)
    }
  }

  const studyOptions = [
    {
      id: 'light',
      icon: (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: 56,
          height: 56,
          backgroundColor: '#DCFCE7',
          borderRadius: 16,
        }}>
          <Text style={{
            width: 28,
            height: 32,
            fontFamily: 'Arimo',
            fontWeight: '400',
            fontSize: 24,
            lineHeight: 32,
            color: '#00C950',
          }}>✅</Text>
        </View>
      ),
      label: 'Light',
      duration: '10 min / day',
    },
    {
      id: 'regular',
      icon: (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: 56,
          height: 56,
          backgroundColor: '#DCFCE7',
          borderRadius: 16,
        }}>
          <Text style={{
            width: 28,
            height: 32,
            fontFamily: 'Arimo',
            fontWeight: '400',
            fontSize: 24,
            lineHeight: 32,
            color: '#00C950',
          }}>🔥</Text>
        </View>
      ),
      label: 'Regular',
      duration: '20 min / day',
    },
    {
      id: 'focused',
      icon: (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: 56,
          height: 56,
          backgroundColor: '#DCFCE7',
          borderRadius: 16,
        }}>
          <Text style={{
            width: 28,
            height: 32,
            fontFamily: 'Arimo',
            fontWeight: '400',
            fontSize: 24,
            lineHeight: 32,
            color: '#00C950',
          }}>💪</Text>
        </View>
      ),
      label: 'Focused',
      duration: '60 min / day',
    },
    {
      id: 'intense',
      icon: (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: 56,
          height: 56,
          backgroundColor: '#0D542B',
          borderRadius: 16,
        }}>
          <Text style={{
            width: 28,
            height: 32,
            fontFamily: 'Arimo',
            fontWeight: '400',
            fontSize: 24,
            lineHeight: 32,
            color: '#7BF1A8',
          }}>⚡</Text>
        </View>
      ),
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

      {/* Header with back button */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000000" />
          </Pressable>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.subTitle}>Personalizing Flinote for you...</Text>
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
        <ContinueButton
          onPress={handleContinue}
        />
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressBarContainer: {
    flex: 1,
    marginBottom: 24,
    marginTop: 20,
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
    fontSize: 15,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 22,
    color: '#7C3AED',
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
    paddingBottom: 20,
    paddingTop: 12,
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