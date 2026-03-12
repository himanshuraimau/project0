/**
 * Flinote Design System — Semantic colors by theme
 * Use tokens like colors.background, colors.primary in the app.
 */

import { brand, neutral } from './palette'
import { statusColors } from './status-colors'
import type { SemanticColors, ThemeMode } from './types'

const primaryForegroundLight = '#faf5ff' as const
const primaryForegroundDark = neutral[950]

export const semanticLight: SemanticColors = {
  background: neutral[0],
  foreground: neutral[950],
  card: neutral[50],
  cardForeground: neutral[950],
  popover: neutral[0],
  popoverForeground: neutral[950],
  primary: brand[600],
  primaryForeground: primaryForegroundLight,
  secondary: brand[100],
  secondaryForeground: brand[900],
  muted: neutral[100],
  mutedForeground: neutral[500],
  accent: brand[50],
  accentForeground: brand[900],
  destructive: statusColors.destructive,
  destructiveForeground: statusColors.destructiveForeground,
  border: neutral[200],
  input: neutral[200],
  ring: brand[500],
  sidebar: neutral[50],
  sidebarForeground: neutral[950],
  sidebarPrimary: brand[600],
  sidebarPrimaryForeground: primaryForegroundLight,
  sidebarAccent: neutral[0],
  sidebarAccentForeground: neutral[950],
  sidebarBorder: neutral[200],
  sidebarRing: brand[500],
  success: statusColors.success,
  successForeground: statusColors.successForeground,
  warning: statusColors.warning,
  warningForeground: statusColors.warningForeground,
  info: statusColors.info,
  infoForeground: statusColors.infoForeground,
  chart1: brand[600],
  chart2: brand[400],
  chart3: brand[300],
  chart4: '#c73659' as const,
  chart5: '#5cb85c' as const,
}

export const semanticDark: SemanticColors = {
  background: neutral[950],
  foreground: neutral[50],
  card: neutral[900],
  cardForeground: neutral[50],
  popover: neutral[900],
  popoverForeground: neutral[50],
  primary: brand[400],
  primaryForeground: primaryForegroundDark,
  secondary: brand[900],
  secondaryForeground: neutral[50],
  muted: neutral[800],
  mutedForeground: neutral[400],
  accent: neutral[800],
  accentForeground: neutral[50],
  destructive: '#d64538' as const,
  destructiveForeground: statusColors.destructiveForeground,
  border: neutral[700],
  input: neutral[700],
  ring: brand[400],
  sidebar: neutral[900],
  sidebarForeground: neutral[50],
  sidebarPrimary: brand[400],
  sidebarPrimaryForeground: primaryForegroundDark,
  sidebarAccent: neutral[800],
  sidebarAccentForeground: neutral[50],
  sidebarBorder: neutral[700],
  sidebarRing: brand[400],
  success: statusColors.success,
  successForeground: statusColors.successForeground,
  warning: statusColors.warning,
  warningForeground: statusColors.warningForeground,
  info: statusColors.info,
  infoForeground: statusColors.infoForeground,
  chart1: brand[400],
  chart2: brand[300],
  chart3: brand[500],
  chart4: '#e8556e' as const,
  chart5: '#6ed46e' as const,
}

export function getSemanticColors(mode: ThemeMode): SemanticColors {
  return mode === 'dark' ? semanticDark : semanticLight
}
