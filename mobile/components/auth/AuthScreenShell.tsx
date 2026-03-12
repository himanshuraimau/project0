import { Link } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import React, { type ReactNode } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/hooks/useTheme'
import { radius as dsRadius, spacing as dsSpacing } from '@/lib/design-system'
import { Animated, authEntrance, usePressScale } from '@/lib/ui/auth-animations'
import { FadeIn } from 'react-native-reanimated'

const GOOGLE_LOGO = require('../../assets/icons/googlePng.webp')

export type AuthScreenShellProps = {
  title: string
  subtitle: string
  googleButtonLabel: string
  onGooglePress: () => void
  footerPrompt: string
  footerLinkLabel: string
  footerLinkHref: string
  footerExtra?: ReactNode
  loading?: boolean
}

export function AuthScreenShell({
  title,
  subtitle,
  googleButtonLabel,
  onGooglePress,
  footerPrompt,
  footerLinkLabel,
  footerLinkHref,
  footerExtra,
  loading = false,
}: AuthScreenShellProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [scaleStyle, pressIn, pressOut] = usePressScale()

  const ctaShadow = theme.shadow({ offset: 3, opacity: isDark ? 0.3 : 0.14 })

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={isDark ? [c.background, theme.neutral[900]] : [c.background, theme.brand[50]]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top spacer — pushes content to lower-center for natural thumb reach */}
          <View style={styles.topSpacer} />

          {/* App icon */}
          <Animated.View entering={authEntrance.logo} style={styles.iconSection}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDark ? theme.neutral[800] : theme.neutral[100],
                  borderRadius: dsRadius.radiusXl,
                },
              ]}
            >
              <Image
                source={require('../../assets/images/flinote-logo.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Headline + subhead */}
          <Animated.View entering={authEntrance.headline} style={styles.copySection}>
            <Text
              style={[
                styles.title,
                {
                  color: c.foreground,
                  fontWeight: t.weightBold,
                },
              ]}
            >
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
              {subtitle}
            </Text>
          </Animated.View>

          {/* Primary CTA */}
          <Animated.View entering={authEntrance.button} style={[styles.ctaSection, scaleStyle]}>
            <Pressable
              onPress={onGooglePress}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={loading}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: c.primary,
                  borderRadius: dsRadius.radiusFull,
                  opacity: loading ? 0.7 : pressed ? 0.92 : 1,
                },
                ctaShadow,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={c.primaryForeground} />
              ) : (
                <>
                  <View
                    style={[
                      styles.gBadge,
                      {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: dsRadius.radiusFull,
                      },
                    ]}
                  >
                    <Image source={GOOGLE_LOGO} style={styles.gLogo} />
                  </View>
                  <Text
                    style={[
                      styles.ctaLabel,
                      {
                        color: c.primaryForeground,
                        fontWeight: t.weightSemibold,
                      },
                    ]}
                  >
                    {googleButtonLabel}
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Footer nav */}
          <Animated.View entering={authEntrance.footer} style={styles.footerSection}>
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: c.mutedForeground }]}>
                {footerPrompt}{' '}
              </Text>
              <Link href={footerLinkHref as any} asChild>
                <Pressable hitSlop={12}>
                  <Text
                    style={[
                      styles.footerLink,
                      { color: c.primary, fontWeight: t.weightSemibold },
                    ]}
                  >
                    {footerLinkLabel}
                  </Text>
                </Pressable>
              </Link>
            </View>

            {footerExtra ? (
              <Animated.View
                entering={FadeIn.duration(280).delay(320)}
                style={styles.extraWrap}
              >
                {footerExtra}
              </Animated.View>
            ) : null}
          </Animated.View>

          {/* Bottom spacer — balances vertical rhythm */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const HORIZONTAL_PAD = dsSpacing.space6 // 24px
const CTA_HEIGHT = 56

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: HORIZONTAL_PAD,
  },

  topSpacer: { flex: 3, minHeight: Platform.OS === 'ios' ? 56 : 40 },
  bottomSpacer: { flex: 1, minHeight: 32 },

  iconSection: {
    alignItems: 'center',
    marginBottom: dsSpacing.space6,
  },
  iconWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 34, height: 34 },

  copySection: {
    alignItems: 'center',
    marginBottom: dsSpacing.space8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: dsSpacing.space2,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 300,
  },

  ctaSection: {},
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: CTA_HEIGHT,
    width: '100%',
  },
  gBadge: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  gLogo: { width: 18, height: 18 },
  ctaLabel: { fontSize: 17 },

  footerSection: {
    alignItems: 'center',
    marginTop: dsSpacing.space6,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: { fontSize: 15, lineHeight: 21 },
  footerLink: { fontSize: 15, lineHeight: 21 },
  extraWrap: {
    marginTop: dsSpacing.space5,
    paddingHorizontal: dsSpacing.space2,
    alignItems: 'center',
  },
})
