import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native'
import { ContinueButton } from '../ui/ContinueButton'

interface FeatureCardProps {
  icon: React.ReactNode
  label: string
  isSelected: boolean
  onPress: () => void
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  label,
  isSelected,
  onPress,
}) => {
  return (
    <Pressable
      style={[styles.featureCard, isSelected && styles.featureCardSelected]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.featureLabel}>{label}</Text>
      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#7C3AED" />
        </View>
      )}
    </Pressable>
  )
}

interface OnboardingStep4Props {
  onContinue?: () => void
}

export default function OnboardingStep4({ onContinue }: OnboardingStep4Props) {
  const router = useRouter()
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    )
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else {
      router.push('/(onboarding)/step5' as any)
    }
  }

  const features = [
    {
      id: 'record',
      icon: <Image source={require('../../assets/images/record-audio.png')} style={{ width: 60, height: 60 }} />,
      label: 'Record lectures',
    },
    {
      id: 'notes',
      icon: <Image source={require('../../assets/images/instant-notes.png')} style={{ width: 60, height: 60 }} />,
      label: 'Instant Notes',
    },
    {
      id: 'transcripts',
      icon: <Image source={require('../../assets/images/quick-transcripts.png')} style={{ width: 60, height: 60 }} />,
      label: 'Quick Transcripts',
    },
    {
      id: 'ai-chat',
      icon: <Image source={require('../../assets/images/chat-with-ai.png')} style={{ width: 60, height: 60 }} />,
      label: 'Chat with AI',
    },
    {
      id: 'quiz',
      icon: <Image source={require('../../assets/images/ai-quiz-tests.png')} style={{ width: 60, height: 60 }} />,
      label: 'AI Quiz Tests',
    },
    {
      id: 'flashcards',
      icon: <Image source={require('../../assets/images/flashcards.png')} style={{ width: 60, height: 60 }} />,
      label: 'Flashcards',
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

      <View style={[styles.scrollView, styles.contentContainer]}>
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.subTitle}>Personalizing Jellinote for you...</Text>
          <Text style={styles.mainTitle}>
            Which part of Jellinote will help you most?
          </Text>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.gridContainer}>
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              label={feature.label}
              isSelected={selectedFeatures.includes(feature.id)}
              onPress={() => toggleFeature(feature.id)}
            />
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <ContinueButton
          onPress={handleContinue}
          disabled={selectedFeatures.length === 0}
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
    paddingTop: 10,
    paddingHorizontal: 24,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'relative',
  },
  featureCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  iconContainer: {
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
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
