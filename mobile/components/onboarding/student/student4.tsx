import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { BlurView } from 'expo-blur'
import Animated from 'react-native-reanimated'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { ContinueButton } from '../../ui/ContinueButton'
import { useTheme } from '@/lib/hooks/useTheme'
import { onboardingEntrance } from '@/lib/ui/auth-animations'

export default function Student4() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const BULLETS = [
    'Take detailed lecture notes',
    'Make AI practice exams',
    'Get detailed transcripts',
    'Chat with long PDFs & docs',
  ]

  return (
    <OnboardingScreenShell
      currentStep={4}
      totalSteps={9}
      showBackButton={true}
      subHeading="You're in good company!"
      mainHeading="Thousands of students use Flinote to:"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/student-flow/student5' as any)}
        />
      }
    >
      <View style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }]}>
        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)' }]} />
        <View style={styles.cardContent}>
          {BULLETS.map((b, i) => (
            <Animated.View key={i} entering={onboardingEntrance.option(i)} style={styles.bulletRow}>
              <View style={[styles.checkWrap, { backgroundColor: c.primary }]}>
                <Text style={[styles.check, { color: c.primaryForeground }]}>✓</Text>
              </View>
              <Text style={[styles.bulletText, { color: c.foreground }]}>{b}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </OnboardingScreenShell>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    gap: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 14,
    fontWeight: '500',
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
})
