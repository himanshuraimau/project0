/**
 * iOS-style entrance animations for welcome & auth screens.
 * Tuned for that satisfying Apple spring feel — slight overshoot, smooth decel.
 * Uses Reanimated layout animations.
 */

import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  useAnimatedReaction,
  SlideInDown,
} from 'react-native-reanimated'

/* ── Spring configs ──────────────────────────────────────────────────── */

/** iOS default-feel spring — smooth, barely any bounce */
const SPRING_SMOOTH = { damping: 20, stiffness: 180, mass: 0.8 }

/** Slightly bouncier — for hero elements that should feel alive */
const SPRING_BOUNCE = { damping: 14, stiffness: 140, mass: 0.7 }

/** Snappy — for buttons and small elements */
const SPRING_SNAPPY = { damping: 18, stiffness: 220, mass: 0.6 }

/** Heavy — for bottom sheets sliding up */
const SPRING_HEAVY = { damping: 22, stiffness: 160, mass: 1 }

/* ── Stagger timing ──────────────────────────────────────────────────── */
const STAGGER = 50

/* ── Entrance presets ────────────────────────────────────────────────── */

export const authEntrance = {
  /** Logo / top bar — fade in gently */
  logo: FadeIn.duration(500).delay(0),

  /** Headline — float up with spring */
  headline: FadeInUp
    .duration(500)
    .delay(STAGGER)
    .springify()
    .damping(SPRING_SMOOTH.damping)
    .stiffness(SPRING_SMOOTH.stiffness)
    .mass(SPRING_SMOOTH.mass),

  /** Subtitle — soft fade */
  sub: FadeIn.duration(400).delay(STAGGER * 2),

  /** CTA button — slide up from below */
  button: FadeInUp
    .duration(450)
    .delay(STAGGER * 3)
    .springify()
    .damping(SPRING_SNAPPY.damping)
    .stiffness(SPRING_SNAPPY.stiffness)
    .mass(SPRING_SNAPPY.mass),

  /** Footer — gentle fade */
  footer: FadeIn.duration(400).delay(STAGGER * 4),

  /** Indexed list items */
  item: (i: number) =>
    FadeIn.duration(350).delay(STAGGER * 2 + i * 40),
}

/* ── Welcome screen presets ──────────────────────────────────────────── */

export const welcomeEntrance = {
  /** Feature tile — fade + scale up from small, staggered */
  tile: (i: number) =>
    ZoomIn
      .duration(400)
      .delay(100 + i * 55)
      .springify()
      .damping(SPRING_BOUNCE.damping)
      .stiffness(SPRING_BOUNCE.stiffness)
      .mass(SPRING_BOUNCE.mass),

  /** App icon — scale in with satisfying bounce */
  appIcon: ZoomIn
    .duration(500)
    .delay(250)
    .springify()
    .damping(SPRING_BOUNCE.damping)
    .stiffness(SPRING_BOUNCE.stiffness)
    .mass(SPRING_BOUNCE.mass),

  /** Copy block — float up from below */
  copy: FadeInUp
    .duration(500)
    .delay(350)
    .springify()
    .damping(SPRING_SMOOTH.damping)
    .stiffness(SPRING_SMOOTH.stiffness)
    .mass(SPRING_SMOOTH.mass),

  /** Bottom bar — slide up from off-screen */
  bottomBar: FadeInDown
    .duration(450)
    .delay(450)
    .springify()
    .damping(SPRING_SNAPPY.damping)
    .stiffness(SPRING_SNAPPY.stiffness)
    .mass(SPRING_SNAPPY.mass),
}

/* ── Auth screen presets ─────────────────────────────────────────────── */

export const authScreenEntrance = {
  /** Grid tile — zoom in with stagger */
  tile: (i: number) =>
    ZoomIn
      .duration(380)
      .delay(60 + i * 60)
      .springify()
      .damping(SPRING_BOUNCE.damping)
      .stiffness(SPRING_BOUNCE.stiffness)
      .mass(SPRING_BOUNCE.mass),

  /** App icon — scale in with a satisfying pop */
  appIcon: ZoomIn
    .duration(500)
    .delay(280)
    .springify()
    .damping(12)
    .stiffness(120)
    .mass(0.6),

  /** Bottom sheet — heavy slide up */
  sheet: SlideInDown
    .duration(600)
    .delay(200)
    .springify()
    .damping(SPRING_HEAVY.damping)
    .stiffness(SPRING_HEAVY.stiffness)
    .mass(SPRING_HEAVY.mass),

  /** Sheet content — staggered fade up inside */
  sheetTitle: FadeInUp
    .duration(400)
    .delay(450)
    .springify()
    .damping(SPRING_SMOOTH.damping)
    .stiffness(SPRING_SMOOTH.stiffness),

  sheetButton: FadeInUp
    .duration(400)
    .delay(520)
    .springify()
    .damping(SPRING_SNAPPY.damping)
    .stiffness(SPRING_SNAPPY.stiffness),

  sheetFooter: FadeIn.duration(350).delay(600),
}

/* ── Onboarding presets ───────────────────────────────────────────────── */

export const onboardingEntrance = {
  /** Header text — float up gently */
  header: FadeInUp
    .duration(450)
    .delay(40)
    .springify()
    .damping(SPRING_SMOOTH.damping)
    .stiffness(SPRING_SMOOTH.stiffness)
    .mass(SPRING_SMOOTH.mass),

  /** Option row/card — staggered zoom with bounce */
  option: (i: number) =>
    ZoomIn
      .duration(350)
      .delay(80 + i * 55)
      .springify()
      .damping(SPRING_BOUNCE.damping)
      .stiffness(SPRING_BOUNCE.stiffness)
      .mass(SPRING_BOUNCE.mass),

  /** Footer / continue button — slide up snappy */
  footer: FadeInUp
    .duration(400)
    .delay(300)
    .springify()
    .damping(SPRING_SNAPPY.damping)
    .stiffness(SPRING_SNAPPY.stiffness)
    .mass(SPRING_SNAPPY.mass),

  /** Progress bar — smooth width animation handled via withTiming */
}

/* ── Press interaction ───────────────────────────────────────────────── */

/** Returns [scaleStyle, pressIn, pressOut] for wrapping a pressable. */
export function usePressScale(scaleDown = 0.97) {
  const pressed = useSharedValue(0)
  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? scaleDown : 1, SPRING_SNAPPY) },
    ],
  }))
  return [
    style,
    () => { pressed.value = 1 },
    () => { pressed.value = 0 },
  ] as const
}

export { Animated }
