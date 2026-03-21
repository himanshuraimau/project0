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

  return (
    <View style={[styles.root, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Nav bar */}
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
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  opacity: pressed ? 0.5 : 1,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={c.foreground} />
            </Pressable>
          ) : (
            <View style={styles.backBtnSpacer} />
          )}

          {/* Progress bar — iOS-style continuous track */}
          <View style={[styles.progressTrack, { backgroundColor: dotInactive }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: dotActive,
                  width: `${(currentStep / totalSteps) * 100}%`,
                },
              ]}
            />
          </View>

          <View style={styles.backBtnSpacer} />
        </View>

        {/* Scrollable content */}
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

        {/* Footer */}
        {footer != null && (
          <Animated.View entering={onboardingEntrance.footer} style={styles.footerWrap}>
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  backgroundColor: isDark ? neutral[950] : '#f0f0f0',
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
    paddingBottom: 16,
    gap: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnSpacer: { width: 36 },

  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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
    letterSpacing: 0.6,
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
