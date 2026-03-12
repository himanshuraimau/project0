/**
 * Flinote Design System — Typography
 * Base 16px; iOS HIG–aligned scale. Use system fonts on iOS for premium feel.
 * Font families: DM Sans (sans), Space Mono (mono). Load via expo-font when available.
 */

import { Platform } from 'react-native'
import type { TypographyScale } from './types'

const fontStack = Platform.select({
  ios: 'System', // SF Pro on iOS; substitute DM Sans when loaded
  android: 'System',
  default: 'System',
})

const fontMonoStack = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
})

export const typography: TypographyScale = {
  fontSans: fontStack,
  fontMono: fontMonoStack,
  fontDisplay: fontStack,
  // px (base 16)
  textXs: 12,
  textSm: 14,
  textBase: 16,
  textLg: 18,
  textXl: 20,
  text2xl: 24,
  text3xl: 30,
  text4xl: 36,
  text5xl: 48,
  text6xl: 60,
  // line height (multiplier → px used via lineHeight: fontSize * value)
  leadingTight: 1.25,
  leadingSnug: 1.375,
  leadingNormal: 1.5,
  leadingRelaxed: 1.625,
  leadingLoose: 2,
  leading7: 1.75,
  // letter spacing (em → use as fontSize * value for React Native)
  trackingTighter: -0.05,
  trackingTight: -0.025,
  trackingNormal: 0,
  trackingWide: 0.025,
  trackingWider: 0.05,
  trackingWidest: 0.1,
  weightNormal: '400',
  weightMedium: '500',
  weightSemibold: '600',
  weightBold: '700',
}
