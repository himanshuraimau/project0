import { palette } from './palette'
import { borderWidth, fontSize, radius, spacing } from './scales'
import { brutalistShadowFactory } from './shadow'
import type { BrutalistTheme, SemanticColors, ThemeMode } from './types'

const lightColors: SemanticColors = {
  background: '#f2f2f7',
  surface: palette.white,
  surfaceAlt: palette.white,
  text: palette.nearBlack,
  mutedText: palette.gray500,
  border: palette.purpleMid,
  primary: palette.purple,
  primaryText: palette.white,
  accent: palette.yellow,
  success: '#00D68F' as const,
  warning: palette.orange,
  danger: palette.orange,
  inputBackground: palette.white,
}

const darkColors: SemanticColors = {
  background: '#1e1e23' as const,
  surface: '#161618' as const,
  surfaceAlt: '#121214' as const,
  text: '#F7F7F7' as const,
  mutedText: '#C7C7C7' as const,
  border: '#A855F7' as const,
  primary: palette.purple,
  primaryText: palette.white,
  accent: palette.yellow,
  success: '#00E6A5' as const,
  warning: '#FF8A1C' as const,
  danger: palette.orange,
  inputBackground: '#1A1A1A' as const,
}

export const themeLight: BrutalistTheme = {
  name: 'neo-brutalism-light',
  colors: lightColors,
  palette,
  spacing,
  radius,
  fontSize,
  borderWidth,
  shadow: brutalistShadowFactory('#000000'),
}

export const themeDark: BrutalistTheme = {
  name: 'neo-brutalism-dark',
  colors: darkColors,
  palette,
  spacing,
  radius,
  fontSize,
  borderWidth,
  shadow: brutalistShadowFactory('#000000'),
}

export function getTheme(mode: ThemeMode = 'light'): BrutalistTheme {
  return mode === 'dark' ? themeDark : themeLight
}


