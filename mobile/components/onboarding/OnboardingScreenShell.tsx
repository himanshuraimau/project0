/**
 * Shared onboarding shell. Theme-aware: all colors from semantic tokens,
 * all radius/spacing from design-system scale, shadows via theme.shadow().
 */

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, type ReactNode } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  StyleSheet,
} from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/hooks/useTheme'
import { radius as dsRadius, spacing as dsSpacing } from '@/lib/design-system'
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

  const progress = Math.min(1, Math.max(0, currentStep / totalSteps))
  const progressWidth = useSharedValue(progress)
  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 380 })
  }, [progress, progressWidth])

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }))

  const backBtnShadow = theme.shadow({ offset: 1, opacity: isDark ? 0.15 : 0.06 })

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[c.background, isDark ? c.card : c.accent]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top bar */}
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
                {
                  backgroundColor: c.card,
                  borderRadius: dsRadius.radiusFull,
                  opacity: pressed ? 0.7 : 1,
                },
                backBtnShadow,
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={c.foreground} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}

          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: c.muted,
                borderRadius: dsRadius.radiusFull,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: c.primary, borderRadius: dsRadius.radiusFull },
                progressStyle,
              ]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.duration(300).delay(60).springify()}
            style={styles.header}
          >
            <Text
              style={[
                styles.subHeading,
                {
                  color: c.primary,
                  fontSize: t.textSm,
                  fontWeight: t.weightSemibold,
                },
              ]}
            >
              {subHeading}
            </Text>
            <Text
              style={[
                styles.mainHeading,
                {
                  color: c.foreground,
                  fontWeight: t.weightBold,
                },
              ]}
            >
              {mainHeading}
            </Text>
          </Animated.View>

          {children}
        </ScrollView>

        {footer != null ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dsSpacing.space5,
    paddingTop: Platform.OS === 'ios' ? 6 : 10,
    paddingBottom: dsSpacing.space4,
    gap: dsSpacing.space3,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: dsSpacing.space6,
    paddingTop: dsSpacing.space2,
    paddingBottom: dsSpacing.space10,
  },

  header: { marginBottom: dsSpacing.space8 },
  subHeading: { marginBottom: dsSpacing.space1 },
  mainHeading: {
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.4,
  },

  footer: {
    paddingHorizontal: dsSpacing.space6,
    paddingTop: dsSpacing.space3,
    paddingBottom: dsSpacing.space5,
  },
})
