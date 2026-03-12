/**
 * Flinote Design System — Shadows
 * iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius.
 * Android: elevation. Violet-tinted in light; neutral in dark.
 */

import { Platform } from 'react-native'
import { brand, neutral } from './palette'
import type { FlinoteTheme } from './types'
import type { ShadowPreset } from './types'
import type { ThemeMode } from './types'

const violetTint = brand[500]
const blackAlpha = 'rgba(0,0,0,0.45)'

function preset(
  color: string,
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number
): ShadowPreset {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Platform.select({ android: elevation, ios: 0, default: elevation }),
  }
}

export function getShadowPresets(mode: ThemeMode): FlinoteTheme['shadow'] {
  const isDark = mode === 'dark'
  const shadowColor = isDark ? neutral[900] : violetTint
  const neutralShadow = isDark ? blackAlpha : 'rgba(0,0,0,0.08)'

  return {
    shadow2xs: preset(neutralShadow, 1, 1, 0.03, 1),
    shadowXs: preset(neutralShadow, 1, 2, 0.04, 2),
    shadowSm: preset(neutralShadow, 2, 4, 0.05, 3),
    shadowMd: preset(neutralShadow, 4, 8, 0.06, 4),
    shadowLg: preset(neutralShadow, 8, 16, 0.08, 6),
    shadowXl: preset(neutralShadow, 16, 32, 0.1, 8),
    shadow2xl: preset(neutralShadow, 24, 48, 0.12, 12),
    shadowBrand: preset(shadowColor, 4, 14, isDark ? 0.35 : 0.25, 4),
    shadowBrandLg: preset(shadowColor, 8, 24, isDark ? 0.4 : 0.3, 6),
  }
}
