/**
 * Premium onboarding shell — true iOS glass.
 * BlurView footer, frosted nav, material depth.
 */

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { type ReactNode } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  StyleSheet,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import { onboardingEntrance } from '@/lib/ui/auth-animations'
import * as Haptics from 'expo-haptics'

export type OnboardingScreenShellProps = {
  currentStep: number
  totalSteps?: number
  subHeading: string
  mainHeading: string
  showBackButton?: boolean
  children: ReactNode
  contentContainerStyle?: object
  footer?: ReactNode
}

export function OnboardingScreenShell({
  currentStep,
  totalSteps = 5,
  subHeading,
  mainHeading,
  showBackButton = false,
  children,
  contentContainerStyle,
  footer,
}: OnboardingScreenShellProps) {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'

  const dotActive = c.primary
  const dotInactive = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  // Ambient background — subtle depth, not a flat fill
  const bgFrom = isDark ? neutral[950] : '#f4f4f8'
  const bgTo = isDark ? '#0d0c16' : '#ecedf4'

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[bgFrom, bgTo, bgFrom]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* ── Nav bar: frosted back button + progress dots ─── */}
        <View style={styles.navBar}>
          {showBackButton ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.back()
              }}
              hitSlop={14}
              style={({ pressed }) => [
                styles.backBtn,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <BlurView
                intensity={isDark ? 30 : 50}
                tint={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  styles.backBtnOverlay,
                  {
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.3)',
                  },
                ]}
              />
              <Ionicons name="chevron-back" size={18} color={c.foreground} />
            </Pressable>
          ) : (
            <View style={styles.backBtnSpacer} />
          )}

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i < currentStep ? dotActive : dotInactive,
                    width: i < currentStep ? 22 : 7,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.backBtnSpacer} />
        </View>

        {/* ── Scrollable content ─────────────────────────────── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={onboardingEntrance.header} style={styles.header}>
            <Text
              style={[
                styles.subHeading,
                { color: c.primary, fontWeight: t.weightSemibold },
              ]}
            >
              {subHeading}
            </Text>
            <Text
              style={[
                styles.mainHeading,
                { color: c.foreground, fontWeight: t.weightBold },
              ]}
            >
              {mainHeading}
            </Text>
          </Animated.View>

          {children}
        </ScrollView>

        {/* ── Frosted footer bar ─────────────────────────────── */}
        {footer != null && (
          <Animated.View entering={onboardingEntrance.footer} style={styles.footerWrap}>
            <BlurView
              intensity={isDark ? 40 : 70}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  backgroundColor: isDark ? 'rgba(12,11,20,0.5)' : 'rgba(255,255,255,0.4)',
                },
              ]}
            />
            <View style={styles.footerInner}>
              {footer}
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 4 : 10,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backBtnOverlay: {
    borderRadius: 12,
    borderWidth: 1,
  },
  backBtnSpacer: { width: 38 },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },

  header: { marginBottom: 28 },
  subHeading: {
    fontSize: 13,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  mainHeading: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },

  footerWrap: {
    overflow: 'hidden',
  },
  footerInner: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 10,
  },
})
