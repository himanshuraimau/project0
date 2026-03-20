import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Line, Polyline } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import Animated from 'react-native-reanimated'
import { OnboardingScreenShell } from '../OnboardingScreenShell'
import { ContinueButton } from '../../ui/ContinueButton'
import { useTheme } from '@/lib/hooks/useTheme'
import { onboardingEntrance } from '@/lib/ui/auth-animations'

export default function Student9() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const currentGpa = parseFloat(params.currentGpa as string) || 3.8
  const goalGpa = parseFloat(params.goalGpa as string) || 3.8
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [activeChart, setActiveChart] = useState<'Flinote' | 'self-study'>('Flinote')

  const chartWidth = 281.02
  const chartHeight = 192

  const gpaToY = (gpa: number) => chartHeight - (gpa / 10) * chartHeight

  const FlinotePoints = [
    { x: 0, y: gpaToY(currentGpa) },
    { x: 60, y: gpaToY(currentGpa + (goalGpa - currentGpa) * 0.25) },
    { x: 120, y: gpaToY(currentGpa + (goalGpa - currentGpa) * 0.5) },
    { x: 180, y: gpaToY(currentGpa + (goalGpa - currentGpa) * 0.75) },
    { x: 240, y: gpaToY(goalGpa) },
  ]

  const selfStudyPoints = [
    { x: 0, y: gpaToY(currentGpa) },
    { x: 60, y: gpaToY(currentGpa) },
    { x: 120, y: gpaToY(currentGpa) },
    { x: 180, y: gpaToY(currentGpa) },
    { x: 240, y: gpaToY(currentGpa) },
  ]

  const FlinotePolyline = FlinotePoints
    .map(point => `${(point.x / 240) * chartWidth},${point.y}`)
    .join(' ')

  const selfStudyPolyline = selfStudyPoints
    .map(point => `${(point.x / 240) * chartWidth},${point.y}`)
    .join(' ')

  return (
    <OnboardingScreenShell
      currentStep={9}
      totalSteps={9}
      showBackButton={true}
      subHeading="Nice start!"
      mainHeading="Consistency compounds."
      footer={
        <ContinueButton
          onPress={() => router.push('/(onboarding)/step4' as any)}
        />
      }
    >
      <Animated.View entering={onboardingEntrance.option(0)}>
        <Text style={[styles.description, { color: c.mutedForeground }]}>
          Record and review regularly to see steady progress.
        </Text>
      </Animated.View>

      <Animated.View
        entering={onboardingEntrance.option(1)}
        style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }]}
      >
        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)' }]} />

        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: c.foreground, fontWeight: t.weightSemibold }]}>Your GPA</Text>
            <View style={styles.badges}>
              <Pressable
                onPress={() => setActiveChart('Flinote')}
                style={[
                  styles.badge,
                  activeChart === 'Flinote'
                    ? { backgroundColor: c.primary }
                    : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
              >
                <Text style={[
                  styles.badgeText,
                  { color: activeChart === 'Flinote' ? c.primaryForeground : c.mutedForeground },
                ]}>
                  with Flinote
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveChart('self-study')}
                style={[
                  styles.badge,
                  activeChart === 'self-study'
                    ? { backgroundColor: c.primary }
                    : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
              >
                <Text style={[
                  styles.badgeText,
                  { color: activeChart === 'self-study' ? c.primaryForeground : c.mutedForeground },
                ]}>
                  self-study
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Svg width={chartWidth} height={chartHeight}>
              {[0, 47.75, 95.51, 143.26, 191.02].map((y, i) => (
                <Line
                  key={i}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                  strokeWidth="0.98"
                />
              ))}

              <Polyline
                points={FlinotePolyline}
                fill="none"
                stroke={activeChart === 'Flinote' ? c.primary : (isDark ? 'rgba(255,255,255,0.15)' : '#D1D1D6')}
                strokeWidth="4.02"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <Polyline
                points={selfStudyPolyline}
                fill="none"
                stroke={activeChart === 'self-study' ? c.primary : (isDark ? 'rgba(255,255,255,0.15)' : '#D1D1D6')}
                strokeWidth="4.02"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      </Animated.View>
    </OnboardingScreenShell>
  )
}

const styles = StyleSheet.create({
  description: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
  },
})
