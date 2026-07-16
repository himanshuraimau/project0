/**
 * Flinote Design System — Icon Colors
 * Apple HIG system-color equivalents, for icon-badge backgrounds.
 * Single source of truth instead of re-typed hex per screen.
 */

export const iconColors = {
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  teal: '#5AC8FA',
  blue: '#007AFF',
  indigo: '#5856D6',
  purple: '#AF52DE',
  pink: '#FF2D55',
  gray: '#8E8E93',
} as const

export type IconColorName = keyof typeof iconColors
