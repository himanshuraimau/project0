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

const FEATURES = [
  'Boost their child\u2019s results with smart study tools',
  'Turn classes into ready-to-review notes',
  'Record and summarize calls & voice notes',
  'Stay present in meetings and get action items automatically',
]

export default function Parent1() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  return (
    <OnboardingScreenShell
      currentStep={1}
      totalSteps={5}
      showBackButton={true}
      subHeading="Welcome"
      mainHeading="You're in the right place."
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/parent/parent2' as any)}
        />
      }
    >
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
        Join thousands of Parents using Flinote to:
      </Text>

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

          {FEATURES.map((text, i) => (
            <View key={i} style={styles.featureItem}>
              <View
                style={[
                  styles.check,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.03)',
                  },
                ]}
              >
                <Ionicons name="checkmark" size={16} color={c.primary} />
              </View>
              <Text
                style={[styles.featureText, { color: c.foreground }]}
              >
                {text}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </OnboardingScreenShell>
  )
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
    gap: 18,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    lineHeight: 21,
    flex: 1,
  },
})
