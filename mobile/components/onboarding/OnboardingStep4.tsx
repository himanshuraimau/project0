import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Platform, Pressable, ScrollView, StatusBar, Text, View, StyleSheet } from 'react-native'

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
      router.replace('/(onboarding)/step5' as any)
    }
  }

  const features = [
    {
      id: 'record',
      icon: <Ionicons name="mic" size={48} color="#7C3AED" />,
      label: 'Record lectures',
    },
    {
      id: 'notes',
      icon: <MaterialCommunityIcons name="note-text" size={48} color="#7C3AED" />,
      label: 'Instant Notes',
    },
    {
      id: 'transcripts',
      icon: <Ionicons name="laptop" size={48} color="#7C3AED" />,
      label: 'Quick Transcripts',
    },
    {
      id: 'ai-chat',
      icon: <MaterialCommunityIcons name="brain" size={48} color="#7C3AED" />,
      label: 'Chat with AI',
    },
    {
      id: 'quiz',
      icon: <MaterialCommunityIcons name="clipboard-check" size={48} color="#7C3AED" />,
      label: 'AI Quiz Tests',
    },
    {
      id: 'flashcards',
      icon: <MaterialCommunityIcons name="cards" size={48} color="#7C3AED" />,
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
            Which part of Coconote will help you most?
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
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={[
            styles.continueButton,
            selectedFeatures.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedFeatures.length === 0}
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
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
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
  continueButtonDisabled: {
    opacity: 0.5,
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
