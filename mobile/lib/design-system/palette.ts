/**
 * Flinote Design System — Brand & Neutral palettes
 * Hex equivalents of oklch (L C 278°). Use semantic tokens in UI when possible.
 */

import type { BrandScale, NeutralScale } from './types'

/** Brand: Violet, hue 278° — oklch gamut-mapped → hex (matches web design-tokens.css) */
export const brand: BrandScale = {
  50: '#f7f9ff',
  100: '#ebeeff',
  200: '#d7dcff',
  300: '#b1baff',
  400: '#858dff',
  500: '#625bfd',
  600: '#4f3be7',
  700: '#402cc3',
  800: '#322599',
  900: '#252070',
  950: '#131141',
}

/** Neutral: slight violet tint — oklch gamut-mapped → hex (matches web design-tokens.css) */
export const neutral: NeutralScale = {
  0: '#ffffff',
  50: '#fbfbfc',
  100: '#f4f4f7',
  200: '#e6e7eb',
  300: '#d2d3d9',
  400: '#8d8e95',
  500: '#6f7077',
  600: '#53545a',
  700: '#3e3f43',
  800: '#28282b',
  900: '#17181a',
  950: '#070708',
}
