import { Link, useRouter } from 'expo-router'
import React, { type ReactNode } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Mic,
  FileText,
  Sparkles,
  BrainCircuit,
  Headphones,
} from 'lucide-react-native'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import { Animated, authScreenEntrance, usePressScale } from '@/lib/ui/auth-animations'

const { width: SCREEN_W } = Dimensions.get('window')
const GRID_EDGE = 40
const GRID_GAP = 10
const TILE = (SCREEN_W - GRID_EDGE * 2 - GRID_GAP * 2) / 3
const ICON_BLOCK = TILE * 2 + GRID_GAP // app icon spans 2x2

/* 3x3 grid: 5 feature tiles + center 2x2 app icon
   Layout (r=row, c=col):
   [Mic]      [Sparkles]  [BrainCircuit]
   [FileText]  ── app icon ──
   [Headphones] ── app icon ──             */
const GRID_TILES = [
  { Icon: Mic, label: 'Record', row: 0, col: 0 },
  { Icon: Sparkles, label: 'AI', row: 0, col: 1 },
  { Icon: BrainCircuit, label: 'Quiz', row: 0, col: 2 },
  { Icon: FileText, label: 'Notes', row: 1, col: 0 },
  { Icon: Headphones, label: 'Podcast', row: 2, col: 0 },
] as const

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

  // Grid tile tints — same as welcome screen
  const tileBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
  const tileBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const iconTint = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'
  const labelTint = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'

  const sheetBg = isDark ? 'rgba(22,20,28,0.85)' : 'rgba(255,255,255,0.88)'
  const sheetBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const handleColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
  const btnBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'

  return (
    <View style={[styles.root, { backgroundColor: isDark ? neutral[950] : '#f2f2f7' }]}>
      {/* ── Hero area — app icon floating in space ──────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroGrid}>
          {/* Feature tiles */}
          {GRID_TILES.map(({ Icon, label, row, col }, i) => (
            <Animated.View
              key={label}
              entering={authScreenEntrance.tile(i)}
              style={[
                styles.tile,
                {
                  top: row * (TILE + GRID_GAP),
                  left: col * (TILE + GRID_GAP),
                  width: TILE,
                  height: TILE,
                  backgroundColor: tileBg,
                  borderColor: tileBorder,
                },
              ]}
            >
              <Icon size={22} color={iconTint} strokeWidth={1.6} />
              <Text style={[styles.tileLabel, { color: labelTint }]}>{label}</Text>
            </Animated.View>
          ))}

          {/* App icon — spans center 2x2 (row 1-2, col 1-2) */}
          <Animated.View
            entering={authScreenEntrance.appIcon}
            style={[
              styles.appIconWrap,
              {
                top: TILE + GRID_GAP,
                left: TILE + GRID_GAP,
              },
              isDark
                ? { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 }
                : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 12 },
            ]}
          >
            <Image
              source={require('../../assets/images/main-logo.png')}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>

      {/* ── Bottom sheet ────────────────────────────────────────── */}
      <Animated.View
        entering={authScreenEntrance.sheet}
        style={[styles.sheet, { borderColor: sheetBorder }]}
      >
        <BlurView
          intensity={isDark ? 60 : 90}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
        />

        {/* Grab handle */}
        <View style={[styles.handle, { backgroundColor: handleColor }]} />

        <SafeAreaView edges={['bottom']} style={styles.sheetInner}>
          {/* Title + subtitle */}
          <Animated.View entering={authScreenEntrance.sheetTitle} style={styles.copyBlock}>
            <Text style={[styles.title, { color: c.foreground, fontWeight: t.weightBold }]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
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
                  backgroundColor: btnBg,
                  borderColor: btnBorder,
                  opacity: loading ? 0.6 : pressed ? 0.7 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={c.foreground} />
              ) : (
                <>
                  <Image source={GOOGLE_LOGO} style={styles.gLogo} />
                  <Text style={[styles.authBtnText, { color: c.foreground, fontWeight: t.weightMedium }]}>
                    {googleButtonLabel}
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={authScreenEntrance.sheetFooter} style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: c.mutedForeground }]}>
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

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Hero — upper portion */
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGrid: {
    width: TILE * 3 + GRID_GAP * 2,
    height: TILE * 3 + GRID_GAP * 2,
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  appIconWrap: {
    position: 'absolute',
    width: ICON_BLOCK,
    height: ICON_BLOCK,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  appIcon: {
    width: ICON_BLOCK * 0.7,
    height: ICON_BLOCK * 0.7,
    borderRadius: 20,
  },

  /* Bottom sheet */
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
    marginBottom: 20,
  },
  sheetInner: {
    paddingHorizontal: 24,
  },

  /* Copy */
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
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
    letterSpacing: 0.05,
  },

  /* Auth button — pill style like Roi */
  authBtn: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  gLogo: { width: 20, height: 20 },
  authBtnText: { fontSize: 16, letterSpacing: -0.1 },

  /* Footer */
  footer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
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
