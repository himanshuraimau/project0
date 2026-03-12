/**
 * Flinote Design System — Brand & Neutral palettes
 * Hex equivalents of oklch (L C 278°). Use semantic tokens in UI when possible.
 */

import type { BrandScale, NeutralScale } from './types'

/** Brand: Violet, hue 278° — oklch → hex */
export const brand: BrandScale = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
  950: '#3b0764',
}

/** Neutral: slight violet tint — oklch → hex */
export const neutral: NeutralScale = {
  0: '#ffffff',
  50: '#fafafa',
  100: '#f5f4f6',
  200: '#e7e5eb',
  300: '#d4d1d9',
  400: '#a29eaa',
  500: '#6f6b78',
  600: '#4f4b55',
  700: '#3d3a42',
  800: '#27252c',
  900: '#1c1a1f',
  950: '#0f0e11',
}
