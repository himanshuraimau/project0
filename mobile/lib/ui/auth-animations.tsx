/**
 * iOS-style entrance animations for auth and welcome screens.
 * Uses Reanimated layout animations; durations aligned with design system motion.
 */

import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const DURATION_FAST = 280
const DURATION_NORMAL = 360
const STAGGER = 60

const springConfig = { damping: 15, stiffness: 150 }

export const authEntrance = {
  logo: FadeIn.duration(DURATION_NORMAL).delay(0),
  headline: FadeInDown.duration(DURATION_NORMAL).delay(STAGGER).springify(),
  sub: FadeIn.duration(DURATION_FAST).delay(STAGGER * 2),
  button: FadeIn.duration(DURATION_FAST).delay(STAGGER * 3),
  footer: FadeIn.duration(DURATION_FAST).delay(STAGGER * 4),
  item: (i: number) => FadeIn.duration(DURATION_FAST).delay(STAGGER * 2 + i * 40),
}

/** Returns [scaleStyle, pressIn, pressOut] for an Animated.View wrapping a pressable. */
export function usePressScale() {
  const pressed = useSharedValue(0)
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.98 : 1, springConfig) }],
  }))
  return [
    style,
    () => { pressed.value = 1 },
    () => { pressed.value = 0 },
  ] as const
}

export { Animated }
