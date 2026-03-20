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

const features = [
  'Capture and summarize staff meetings instantly',
  'Collect and organize notes faster',
  'Inspire students through smarter learning',
  'Support teachers with resources built by AI',
]

export default function Administrator1() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'

  const checkBg = isDark ? 'rgba(79,59,231,0.15)' : 'rgba(79,59,231,0.08)'

  return (
    <OnboardingScreenShell
      currentStep={1}
      totalSteps={3}
      showBackButton
      subHeading="You're in the right place"
      mainHeading="Trusted by thousands of school leaders like you"
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/administrator-flow/administrator2' as any)}
        />
      }
    >
      <View style={{ gap: 14 }}>
        {features.map((text, i) => (
          <Animated.View
            key={i}
            entering={onboardingEntrance.option(i)}
            style={[
              styles.featureRow,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
              },
            ]}
          >
            <BlurView
              intensity={isDark ? 20 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
            />
            <View style={[styles.checkCircle, { backgroundColor: checkBg }]}>
              <Ionicons name="checkmark" size={15} color={c.primary} />
            </View>
            <Text style={[styles.featureText, { color: c.foreground, fontWeight: t.weightMedium }]}>
              {text}
            </Text>
          </Animated.View>
        ))}
      </View>
    </OnboardingScreenShell>
  )
}

const styles = StyleSheet.create({
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 15, lineHeight: 21, flex: 1 },
})
