/**
 * Flinote Design System — Compatibility layer
 * Maps new semantic theme to legacy shape (colors.text, palette, fontSize, shadow fn)
 * so existing components keep working while migrating to design system tokens.
 */

import { Platform } from 'react-native'
import { brand } from './palette'
import { getTheme } from './theme'
import type { FlinoteTheme, ThemeMode } from './types'

export type ThemeWithCompat = Omit<FlinoteTheme, 'shadow' | 'spacing' | 'radius'> & {
  colors: FlinoteTheme['colors'] & {
    text: string
    surface: string
    surfaceAlt: string
    primaryText: string
    inputBackground: string
  }
  palette: {
    purple: string
    purpleMid: string
    purpleDark: string
    purpleHover: string
    yellow: string
    yellowBright: string
    blue: string
    green: string
    orange: string
    violet: string
    black: string
    nearBlack: string
    white: string
    gray200: string
    gray300: string
    gray500: string
    gray700: string
  }
  fontSize: { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number; '3xl': number }
  spacing: { none: number; xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number }
  radius: { none: number; sm: number; md: number; lg: number; xl: number; brutal: number }
  borderWidth: { thin: number; thick: number; brutal: number }
  shadow: (options?: { offset?: number; opacity?: number; color?: string }) => {
    shadowColor: string
    shadowOffset: { width: number; height: number }
    shadowOpacity: number
    shadowRadius: number
    elevation: number
  }
}

function shadowFactory(theme: FlinoteTheme): ThemeWithCompat['shadow'] {
  const preset = theme.shadow.shadowMd
  return (options = {}) => {
    const offset = options.offset ?? 4
    const opacity = options.opacity ?? 0.35
    const color = options.color ?? (theme.mode === 'dark' ? theme.neutral[900] : '#000000')
    return {
      shadowColor: color,
      shadowOffset: { width: offset, height: offset },
      shadowOpacity: opacity,
      shadowRadius: 8,
      elevation: Platform.select({ android: 4, ios: 0, default: 4 }),
    }
  }
}

export function themeWithCompat(mode: ThemeMode): ThemeWithCompat {
  const t = getTheme(mode)
  const { shadow: _shadowPresets, ...rest } = t
  const c = t.colors
  return {
    ...rest,
    colors: {
      ...c,
      text: c.foreground,
      surface: c.card,
      surfaceAlt: c.card,
      primaryText: c.primaryForeground,
      inputBackground: c.card,
    },
    palette: {
      purple: brand[500],
      purpleMid: brand[600],
      purpleDark: brand[700],
      purpleHover: brand[400],
      yellow: '#fbbf24',
      yellowBright: '#fcd34d',
      blue: '#2d7ff9',
      green: '#00d68f',
      orange: '#ff7a00',
      violet: brand[400],
      black: '#000000',
      nearBlack: brand[950],
      white: t.neutral[0],
      gray200: t.neutral[200],
      gray300: t.neutral[300],
      gray500: t.neutral[500],
      gray700: t.neutral[700],
    },
    fontSize: {
      xs: t.typography.textXs,
      sm: t.typography.textSm,
      md: t.typography.textBase,
      lg: t.typography.textLg,
      xl: t.typography.textXl,
      '2xl': t.typography.text2xl,
      '3xl': t.typography.text3xl,
    },
    spacing: {
      none: 0,
      xs: t.spacing.space1,
      sm: t.spacing.space2,
      md: t.spacing.space3,
      lg: t.spacing.space3,
      xl: t.spacing.space4,
      '2xl': t.spacing.space5,
    },
    radius: {
      none: 0,
      sm: t.radius.radiusSm,
      md: t.radius.radiusMd,
      lg: t.radius.radiusLg,
      xl: t.radius.radiusXl,
      brutal: t.radius.radiusMd,
    },
    borderWidth: { thin: 2, thick: 3, brutal: 3 },
    shadow: shadowFactory(t),
  }
}
