import { Link, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/hooks/useTheme'
import { radius as dsRadius } from '@/lib/design-system'
import { Animated, authEntrance, usePressScale } from '@/lib/ui/auth-animations'
import { FadeIn } from 'react-native-reanimated'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const HORIZONTAL_PADDING = 24
const GRID_GAP = 12
const GRID_CELL_SIZE = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2

const WELCOME_IMAGES: ImageSourcePropType[] = [
  require('../../assets/welcome/upload.png'),
  require('../../assets/welcome/ai-processing.png'),
  require('../../assets/welcome/study.png'),
  require('../../assets/welcome/improve.png'),
]

const HEADLINE_FONT_SIZE = 28
const SUB_FONT_SIZE = 16

export default function WelcomeScreen() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [scaleStyle, pressIn, pressOut] = usePressScale()

  const buttonShadow = theme.shadow({ offset: 4, opacity: isDark ? 0.35 : 0.28 })
  const panelShadow = theme.shadow({ offset: 2, opacity: isDark ? 0.2 : 0.08 })

  const gridEntrance = useMemo(
    () => (i: number) => FadeIn.duration(320).delay(80 + i * 50).springify(),
    []
  )

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 2x2 image grid */}
          <View style={styles.grid}>
            {WELCOME_IMAGES.map((source, i) => (
              <Animated.View
                key={i}
                entering={gridEntrance(i)}
                style={[
                  styles.gridCell,
                  {
                    width: GRID_CELL_SIZE,
                    height: GRID_CELL_SIZE,
                    backgroundColor: c.card,
                    borderRadius: dsRadius.radius3xl,
                    overflow: 'hidden',
                  },
                  panelShadow,
                ]}
              >
                <Image
                  source={source}
                  style={[styles.gridImage, { borderRadius: dsRadius.radius3xl }]}
                  resizeMode="cover"
                />
              </Animated.View>
            ))}
          </View>

          {/* Heading */}
          <Animated.View entering={authEntrance.headline} style={styles.textBlock}>
            <Text
              style={[
                styles.headline,
                {
                  color: c.foreground,
                  fontSize: HEADLINE_FONT_SIZE,
                  lineHeight: HEADLINE_FONT_SIZE * 1.22,
                  fontWeight: t.weightBold,
                  letterSpacing: -0.3,
                },
              ]}
            >
              Turn anything into{'\n'}Instant notes
            </Text>
            <Text
              style={[
                styles.sub,
                {
                  color: c.mutedForeground,
                  fontSize: SUB_FONT_SIZE,
                  lineHeight: SUB_FONT_SIZE * 1.4,
                },
              ]}
            >
              Upload content, let AI process it, and get study tools so you can study effortlessly.
            </Text>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={authEntrance.button} style={scaleStyle}>
            <Pressable
              onPress={() => router.push('/(auth)/sign-up' as any)}
              onPressIn={pressIn}
              onPressOut={pressOut}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: c.primary,
                  borderRadius: dsRadius.radiusFull,
                  opacity: pressed ? 0.92 : 1,
                },
                buttonShadow,
              ]}
            >
              <Text
                style={[
                  styles.ctaText,
                  {
                    color: c.primaryForeground,
                    fontSize: 17,
                    fontWeight: t.weightSemibold,
                  },
                ]}
              >
                Get started
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={authEntrance.footer} style={styles.footer}>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable hitSlop={12}>
                <Text
                  style={[
                    styles.footerText,
                    {
                      color: c.mutedForeground,
                      fontSize: t.textSm,
                    },
                  ]}
                >
                  Already have an account? Sign in
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: 28,
  },
  gridCell: {},
  gridImage: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    marginBottom: 28,
    alignItems: 'center',
  },
  headline: {
    textAlign: 'center',
    marginBottom: 12,
  },
  sub: {
    textAlign: 'center',
    maxWidth: 320,
    paddingHorizontal: 8,
  },
  cta: {
    width: '100%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {},
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { textAlign: 'center' },
})
