/**
 * Flinote Design System
 * Single source of truth for the mobile app. Aligned with iOS Human Interface Guidelines.
 * Use theme.colors.*, theme.spacing.*, theme.radius.*, theme.typography.*, theme.motion.*, theme.shadow.*
 */

export { getTheme, themeLight, themeDark } from './theme'
export { themeWithCompat } from './compat'
export type { ThemeWithCompat } from './compat'
export { brand, neutral } from './palette'
export { semanticLight, semanticDark, getSemanticColors } from './semantic'
export { statusColors } from './status-colors'
export { iconColors } from './icon-colors'
export type { IconColorName } from './icon-colors'
export { typography } from './typography'
export { spacing } from './spacing'
export { radius } from './radius'
export { motion } from './motion'
export { getShadowPresets } from './shadow'

export type {
  ColorHex,
  ThemeMode,
  ThemePreference,
  BrandScale,
  NeutralScale,
  SemanticColors,
  TypographyScale,
  SpacingScale,
  RadiusScale,
  MotionScale,
  ShadowPreset,
  FlinoteTheme,
} from './types'
