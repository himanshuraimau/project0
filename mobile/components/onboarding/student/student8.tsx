import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { BlurView } from 'expo-blur'
import Animated from 'react-native-reanimated'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { ContinueButton } from '../../ui/ContinueButton'
import { useTheme } from '@/lib/hooks/useTheme'
import { onboardingEntrance } from '@/lib/ui/auth-animations'

export default function Student8() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const currentGpa = parseFloat(params.currentGpa as string) || 3.8
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [gpa, setGpa] = useState<number>(3.8)
  const intervalRef = useRef<any>(null)

  const dec = () => setGpa((v) => {
    const newVal = Math.max(0, v - 0.1)
    return parseFloat(newVal.toFixed(1))
  })
  const inc = () => setGpa((v) => {
    const newVal = Math.min(10.0, v + 0.1)
    return parseFloat(newVal.toFixed(1))
  })

  const startDecrement = () => {
    dec()
    intervalRef.current = setInterval(() => {
      dec()
    }, 100)
  }

  const startIncrement = () => {
    inc()
    intervalRef.current = setInterval(() => {
      inc()
    }, 100)
  }

  const stopCounter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return (
    <OnboardingScreenShell
      currentStep={8}
      totalSteps={9}
      showBackButton={true}
      subHeading="Personalizing Flinote for you..."
      mainHeading="What is your goal GPA?"
      footer={
        <ContinueButton
          onPress={() => router.push(`/(onboarding)/student-flow/student9?currentGpa=${currentGpa}&goalGpa=${gpa}` as any)}
        />
      }
    >
      <Animated.View entering={onboardingEntrance.option(0)} style={[styles.gpaCard, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }]}>
        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)' }]} />
        <View style={styles.gpaWrap}>
          <TouchableOpacity
            style={[styles.gpaButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPressIn={startDecrement}
            onPressOut={stopCounter}
            activeOpacity={0.8}
          >
            <Text style={[styles.gpaButtonText, { color: c.foreground }]}>−</Text>
          </TouchableOpacity>

          <View style={styles.gpaValueWrap}>
            <Text style={[styles.gpaValue, { color: c.foreground, fontWeight: t.weightBold }]}>{gpa.toFixed(1)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.gpaButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPressIn={startIncrement}
            onPressOut={stopCounter}
            activeOpacity={0.8}
          >
            <Text style={[styles.gpaButtonText, { color: c.foreground }]}>+</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </OnboardingScreenShell>
  )
}

const styles = StyleSheet.create({
  gpaCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gpaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 24,
  },
  gpaButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpaButtonText: {
    fontSize: 28,
    lineHeight: 32,
  },
  gpaValueWrap: {
    minWidth: 80,
    alignItems: 'center',
  },
  gpaValue: {
    fontSize: 48,
    lineHeight: 56,
  },
})
