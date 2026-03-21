import { useRouter } from 'expo-router'
import React, { type ReactNode } from 'react'
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/hooks/useTheme'
import { brand, neutral } from '@/lib/design-system'
import { Animated, authScreenEntrance, usePressScale } from '@/lib/ui/auth-animations'

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
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [scaleStyle, pressIn, pressOut] = usePressScale()

  const sheetBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
  const handleColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const subtleText = isDark ? neutral[400] : neutral[500]

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* Hero — app icon centered in upper space */}
      <View style={styles.hero}>
        <Animated.View
          entering={authScreenEntrance.appIcon}
          style={[
            styles.appIconWrap,
            isDark
              ? {
                  shadowColor: brand[500],
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.2,
                  shadowRadius: 32,
                  elevation: 16,
                }
              : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.12,
                  shadowRadius: 32,
                  elevation: 16,
                },
          ]}
        >
          <Image
            source={require('../../assets/images/main-logo.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom sheet */}
      <Animated.View
        entering={authScreenEntrance.sheet}
        style={[styles.sheet, { borderColor: sheetBorder }]}
      >
        <BlurView
          intensity={isDark ? 50 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
        />

        <View style={[styles.handle, { backgroundColor: handleColor }]} />

        <SafeAreaView edges={['bottom']} style={styles.sheetInner}>
          {/* Title + subtitle */}
          <Animated.View entering={authScreenEntrance.sheetTitle} style={styles.copyBlock}>
            <Text style={[styles.title, { color: c.foreground, fontWeight: t.weightBold }]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: subtleText }]}>
              {subtitle}
            </Text>
          </Animated.View>

          {/* Google button */}
          <Animated.View entering={authScreenEntrance.sheetButton} style={scaleStyle}>
            <Pressable
              onPress={onGooglePress}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={loading}
              style={({ pressed }) => [
                styles.authBtn,
                {
                  backgroundColor: isDark ? neutral[800] : neutral[950],
                  opacity: loading ? 0.7 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={isDark ? c.foreground : neutral[0]} />
              ) : (
                <>
                  <View style={styles.googleLogoWrap}>
                    <Image source={GOOGLE_LOGO} style={styles.gLogo} />
                  </View>
                  <Text
                    style={[
                      styles.authBtnText,
                      {
                        color: isDark ? neutral[50] : neutral[0],
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

          {/* Footer */}
          <Animated.View entering={authScreenEntrance.sheetFooter} style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: subtleText }]}>
                {footerPrompt}{' '}
              </Text>
              <Pressable onPress={() => router.push(footerLinkHref as any)} hitSlop={12}>
                <Text style={[styles.footerLink, { color: c.primary, fontWeight: t.weightSemibold }]}>
                  {footerLinkLabel}
                </Text>
              </Pressable>
            </View>

            {footerExtra ? (
              <View style={styles.extraWrap}>{footerExtra}</View>
            ) : null}
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </View>
  )
}

const ICON_SIZE = 80

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: ICON_SIZE * 0.72,
    height: ICON_SIZE * 0.72,
    borderRadius: 14,
  },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetInner: {
    paddingHorizontal: 24,
  },

  copyBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
    letterSpacing: 0.05,
  },

  authBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  googleLogoWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gLogo: { width: 16, height: 16 },
  authBtnText: {
    fontSize: 17,
    letterSpacing: -0.2,
  },

  footer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: Platform.OS === 'android' ? 16 : 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: { fontSize: 14, lineHeight: 20 },
  footerLink: { fontSize: 14, lineHeight: 20 },
  extraWrap: {
    marginTop: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
})
