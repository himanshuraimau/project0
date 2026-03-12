/**
 * Flinote Design System — Theme builder
 * Resolves theme mode and returns full FlinoteTheme (colors, spacing, motion, etc.).
 */

import { brand } from './palette'
import { neutral } from './palette'
import { motion } from './motion'
import { radius } from './radius'
import { spacing } from './spacing'
import { getSemanticColors } from './semantic'
import { getShadowPresets } from './shadow'
import { typography } from './typography'
import type { FlinoteTheme, ThemeMode } from './types'

export function getTheme(mode: ThemeMode): FlinoteTheme {
  const colors = getSemanticColors(mode)
  return {
    mode,
    colors,
    brand,
    neutral,
    typography,
    spacing,
    radius,
    motion,
    shadow: getShadowPresets(mode),
  }
}

export const themeLight = getTheme('light')
export const themeDark = getTheme('dark')
