/**
 * Flinote Design System — Type definitions
 * Single source of truth for theme; aligned with iOS Human Interface Guidelines.
 * Theme mode: light | dark | system (resolved from device appearance).
 */

export type ColorHex = `#${string}`

/** Resolved theme mode (system → light or dark) */
export type ThemeMode = 'light' | 'dark'

/** User preference: can include 'system' to follow device */
export type ThemePreference = 'light' | 'dark' | 'system'

// —— Brand palette (violet, hue 278°) — hex equivalents of oklch ——
export type BrandScale = {
  50: ColorHex
  100: ColorHex
  200: ColorHex
  300: ColorHex
  400: ColorHex
  500: ColorHex
  600: ColorHex
  700: ColorHex
  800: ColorHex
  900: ColorHex
  950: ColorHex
}

// —— Neutral palette (slight violet tint) ——
export type NeutralScale = {
  0: ColorHex
  50: ColorHex
  100: ColorHex
  200: ColorHex
  300: ColorHex
  400: ColorHex
  500: ColorHex
  600: ColorHex
  700: ColorHex
  800: ColorHex
  900: ColorHex
  950: ColorHex
}

// —— Semantic colors (use these in UI; theme swaps by mode) ——
export type SemanticColors = {
  background: ColorHex
  foreground: ColorHex
  card: ColorHex
  cardForeground: ColorHex
  popover: ColorHex
  popoverForeground: ColorHex
  primary: ColorHex
  primaryForeground: ColorHex
  secondary: ColorHex
  secondaryForeground: ColorHex
  muted: ColorHex
  mutedForeground: ColorHex
  accent: ColorHex
  accentForeground: ColorHex
  destructive: ColorHex
  destructiveForeground: ColorHex
  border: ColorHex
  input: ColorHex
  ring: ColorHex
  sidebar: ColorHex
  sidebarForeground: ColorHex
  sidebarPrimary: ColorHex
  sidebarPrimaryForeground: ColorHex
  sidebarAccent: ColorHex
  sidebarAccentForeground: ColorHex
  sidebarBorder: ColorHex
  sidebarRing: ColorHex
  // Status (shared light/dark)
  success: ColorHex
  successForeground: ColorHex
  warning: ColorHex
  warningForeground: ColorHex
  info: ColorHex
  infoForeground: ColorHex
  // Chart (optional)
  chart1: ColorHex
  chart2: ColorHex
  chart3: ColorHex
  chart4: ColorHex
  chart5: ColorHex
}

// —— Typography (iOS HIG: readable, Dynamic Type–friendly scale) ——
export type TypographyScale = {
  fontSans: string
  fontMono: string
  fontDisplay: string
  textXs: number
  textSm: number
  textBase: number
  textLg: number
  textXl: number
  text2xl: number
  text3xl: number
  text4xl: number
  text5xl: number
  text6xl: number
  leadingTight: number
  leadingSnug: number
  leadingNormal: number
  leadingRelaxed: number
  leadingLoose: number
  leading7: number
  trackingTighter: number
  trackingTight: number
  trackingNormal: number
  trackingWide: number
  trackingWider: number
  trackingWidest: number
  weightNormal: '400'
  weightMedium: '500'
  weightSemibold: '600'
  weightBold: '700'
}

// —— Spacing (4px base; iOS 8pt grid compatible) ——
export type SpacingScale = {
  space0: number
  spacePx: number
  space0_5: number
  space1: number
  space2: number
  space3: number
  space4: number
  space5: number
  space6: number
  space8: number
  space10: number
  space12: number
  space16: number
  space20: number
  space24: number
}

// —— Border radius (default UI: radiusLg 16px) ——
export type RadiusScale = {
  radiusNone: number
  radius2xs: number
  radiusXs: number
  radiusSm: number
  radiusMd: number
  radiusLg: number
  radiusXl: number
  radius2xl: number
  radius3xl: number
  radiusFull: number
}

// —— Motion (respect prefers-reduced-motion) ——
export type MotionScale = {
  durationInstant: number
  durationFast: number
  durationNormal: number
  durationSlow: number
  durationSlower: number
  easeDefault: string
  easeIn: string
  easeOut: string
  easeInOut: string
  easeBounce: string
  easeSmooth: string
}

// —— Shadow (iOS shadowColor/Offset/Opacity/Radius; Android elevation) ——
export type ShadowPreset = {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

export type FlinoteTheme = {
  mode: ThemeMode
  colors: SemanticColors
  brand: BrandScale
  neutral: NeutralScale
  typography: TypographyScale
  spacing: SpacingScale
  radius: RadiusScale
  motion: MotionScale
  shadow: {
    shadow2xs: ShadowPreset
    shadowXs: ShadowPreset
    shadowSm: ShadowPreset
    shadowMd: ShadowPreset
    shadowLg: ShadowPreset
    shadowXl: ShadowPreset
    shadow2xl: ShadowPreset
    shadowBrand: ShadowPreset
    shadowBrandLg: ShadowPreset
  }
}
