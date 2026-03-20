import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '@/lib/hooks/useTheme'
import { ContinueButton } from '../../ui/ContinueButton'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import Animated from 'react-native-reanimated'
import { onboardingEntrance } from '@/lib/ui/auth-animations'

export default function Administrator3() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'

  return (
    <OnboardingScreenShell
      currentStep={3}
      totalSteps={3}
      showBackButton
      subHeading="Personalizing Flinote for you..."
      mainHeading="You're in the right place."
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/step4' as any)}
        />
      }
    >
      {/* Testimonial card — frosted glass */}
      <Animated.View
        entering={onboardingEntrance.option(0)}
        style={[
          styles.card,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
          },
        ]}
      >
        <BlurView
          intensity={isDark ? 25 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.35)',
            },
          ]}
        />

        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardName, { color: c.foreground, fontWeight: t.weightSemibold }]}>
              Josh berk
            </Text>
            <Text style={[styles.cardRole, { color: c.mutedForeground }]}>
              head of school
            </Text>
          </View>
          <View style={styles.stars}>
            {Array.from({ length: 5 }, (_, i) => (
              <Ionicons key={i} name="star" size={14} color="#FFB800" />
            ))}
          </View>
        </View>

        <Text style={[styles.quote, { color: c.foreground }]}>
          "Flinote keeps my all notes organized. I walk away with clean summaries, follow-ups, and no missed details. Even from the busiest days"
        </Text>
      </Animated.View>
    </OnboardingScreenShell>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: { fontSize: 17, lineHeight: 22 },
  cardRole: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 3 },
  quote: { fontSize: 15, lineHeight: 23, letterSpacing: 0.1 },
})
