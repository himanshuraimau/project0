/**
 * Flinote Design System — Glass Tokens
 * Liquid Glass + standard material tokens.
 * Inspired by Apple HIG — Liquid Glass forms a distinct functional layer
 * for controls and navigation that floats above the content layer.
 */

import { Platform } from 'react-native'

/* ── Standard glass fills (content layer) ────────────────────────────── */

export const glass = {
  /** Barely visible — use for hover/resting states */
  light: 'rgba(255,255,255,0.08)',
  /** Default glass card surface */
  medium: 'rgba(255,255,255,0.12)',
  /** Elevated / selected surface */
  heavy: 'rgba(255,255,255,0.18)',
  /** Prominent / active state */
  solid: 'rgba(255,255,255,0.24)',
  /** Hairline border on glass surfaces */
  border: 'rgba(255,255,255,0.12)',
  /** Selected / active border */
  borderActive: 'rgba(255,255,255,0.28)',
  /** Dark glass overlay */
  dark: 'rgba(0,0,0,0.25)',
  /** Dark glass card surface (for light mode) */
  darkLight: 'rgba(0,0,0,0.04)',
  /** Dark glass border (for light mode) */
  darkBorder: 'rgba(0,0,0,0.08)',
} as const

/* ── Liquid Glass (functional layer — controls & navigation) ─────────── */

export const liquidGlass = {
  /** Regular variant — blurs + adjusts luminosity for legibility */
  regular: {
    dark: {
      fill: 'rgba(40,40,50,0.52)',
      border: 'rgba(255,255,255,0.18)',
      /** Specular highlight at top edge — mimics light refraction */
      specularTop: 'rgba(255,255,255,0.22)',
      specularBottom: 'rgba(255,255,255,0)',
      /** Inner glow along top — creates the "liquid" curvature illusion */
      innerGlow: 'rgba(255,255,255,0.06)',
    },
    light: {
      fill: 'rgba(255,255,255,0.62)',
      border: 'rgba(255,255,255,0.7)',
      specularTop: 'rgba(255,255,255,0.85)',
      specularBottom: 'rgba(255,255,255,0.1)',
      innerGlow: 'rgba(255,255,255,0.35)',
    },
  },
  /** Clear variant — highly translucent, for floating over rich media */
  clear: {
    dark: {
      fill: 'rgba(30,30,40,0.35)',
      border: 'rgba(255,255,255,0.12)',
      specularTop: 'rgba(255,255,255,0.15)',
      specularBottom: 'rgba(255,255,255,0)',
    },
    light: {
      fill: 'rgba(255,255,255,0.38)',
      border: 'rgba(255,255,255,0.55)',
      specularTop: 'rgba(255,255,255,0.7)',
      specularBottom: 'rgba(255,255,255,0)',
    },
  },
  /** Tinted variant — brand-colored liquid glass for primary CTAs */
  tinted: (color: string, opacity = 0.45) => ({
    fill: color.replace(')', `,${opacity})`).replace('rgb(', 'rgba('),
  }),
} as const

/* ── Blur intensities ─────────────────────────────────────────────────── */

export const blur = {
  soft: 10,
  medium: 20,
  heavy: 40,
  ultra: 60,
} as const

/* ── Glass shadows (iOS only — elevation on Android) ──────────────────── */

export const glassShadow = {
  /** Subtle depth for resting cards */
  sm: {
    shadowColor: 'rgba(0,0,0,0.20)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
  },
  /** Medium depth for elevated/selected cards */
  md: {
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    ...Platform.select({
      android: { elevation: 5 },
      default: {},
    }),
  },
  /** Large depth for modals/sheets */
  lg: {
    shadowColor: 'rgba(0,0,0,0.32)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
  },
  /** Brand glow — use on primary CTAs */
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    ...Platform.select({
      android: { elevation: 4 },
      default: {},
    }),
  }),
} as const

/* ── Gradient presets ─────────────────────────────────────────────────── */

export const gradients = {
  /** Subtle top-down ambient light on dark surfaces */
  ambientLight: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as const,
  /** Brand accent gradient */
  brand: ['#858dff', '#4f3be7'] as const,
  /** Warm accent for CTAs */
  warmAccent: ['#FFB340', '#FF6B6B'] as const,
} as const

export type GlassTokens = typeof glass
export type LiquidGlassTokens = typeof liquidGlass
export type BlurTokens = typeof blur
export type GlassShadowTokens = typeof glassShadow
