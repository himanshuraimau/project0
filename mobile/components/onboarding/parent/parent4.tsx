import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Animated from 'react-native-reanimated'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { ContinueButton } from '../../ui/ContinueButton'
import { useTheme } from '@/lib/hooks/useTheme'
import { onboardingEntrance } from '@/lib/ui/auth-animations'

export default function Parent4() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'

  return (
    <OnboardingScreenShell
      currentStep={4}
      totalSteps={5}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="You're in the right place."
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/parent/parent5' as any)}
        />
      }
    >
      <Animated.View entering={onboardingEntrance.option(0)}>
        <View
          style={[
            styles.card,
            {
              borderColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.6)',
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 20 : 40}
            tint={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 20,
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(255,255,255,0.5)',
              },
            ]}
          />

          {/* Stars */}
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }, (_, i) => (
              <Ionicons key={i} name="star" size={18} color="#FBBF24" />
            ))}
          </View>

          {/* Quote */}
          <Text style={[styles.quote, { color: c.foreground }]}>
            {"\u201C"}Started out for my oldest, but now everyone's hooked. It's been such a great tool for all my kids in school.{"\u201D"}
          </Text>

          {/* Attribution */}
          <View style={styles.attribution}>
            <Text
              style={[
                styles.name,
                { color: c.foreground, fontWeight: t.weightSemibold },
              ]}
            >
              Jessica Cole
            </Text>
            <Text style={[styles.title, { color: c.mutedForeground }]}>
              Mom of 4
            </Text>
          </View>
        </View>
      </Animated.View>
    </OnboardingScreenShell>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24,
    gap: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  quote: {
    fontSize: 16,
    lineHeight: 24,
  },
  attribution: {
    gap: 2,
  },
  name: {
    fontSize: 15,
  },
  title: {
    fontSize: 13,
  },
})
