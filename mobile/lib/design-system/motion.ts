/**
 * Flinote Design System — Motion
 * Respect prefers-reduced-motion (shorten or disable in components).
 * Use with react-native-reanimated or Animated API.
 */

import type { MotionScale } from './types'

export const motion: MotionScale = {
  durationInstant: 0,
  durationFast: 150,
  durationNormal: 200,
  durationSlow: 300,
  durationSlower: 500,
  easeDefault: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeBounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeSmooth: 'cubic-bezier(0.33, 1, 0.68, 1)',
}
