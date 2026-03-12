# Flinote Design System (Mobile)

Single source of truth for the Flinote mobile app. Aligned with **Apple iOS Human Interface Guidelines** (Layout, Spacing, Typography, Motion, Colors, Accessibility) and the Flinote web theme (violet brand, oklch hue 278°).

## Usage

- **Theme:** Use `useTheme()` from `@/lib/hooks/useTheme`. You get `theme` (with semantic colors, spacing, radius, typography, motion, shadows) and `mode` / `preference`.
- **Semantic colors:** Prefer `theme.colors.*` (e.g. `background`, `foreground`, `primary`, `card`, `muted`, `border`, `ring`, `destructive`, `success`, `warning`, `info`). Do not hardcode hex in UI.
- **Spacing:** Use `theme.spacing.space*` (4px base; iOS 8pt-friendly: `space2` = 8pt).
- **Radius:** Default UI radius is `theme.radius.radiusLg` (16px). Use `theme.radius.radiusFull` for pills.
- **Typography:** Use `theme.typography.textXs` … `text6xl`, `leading*`, `weight*`. Load DM Sans / Space Mono via `expo-font` and set `fontSans` / `fontMono` when ready.
- **Motion:** Use `theme.motion.duration*` and `ease*` with Reanimated/Animated. Respect **Reduce Motion** (shorten or disable animations).
- **Shadows:** Use `theme.shadow.shadowSm` … `shadowBrandLg` for presets, or `theme.shadow({ offset, opacity })` for the legacy helper.

## Theme modes

| Preference | Behavior |
|------------|----------|
| `light`    | Always light |
| `dark`     | Always dark |
| `system`   | Follow device appearance (default) |

Resolved `mode` is always `'light' | 'dark'`. Set preference via `setPreference('light' | 'dark' | 'system')` or `setMode('light' | 'dark')`.

## iOS HIG alignment

- **Layout:** Use `SafeAreaView` or `useSafeAreaInsets()` for notches and home indicator; content respects safe areas.
- **Spacing:** 4px base grid; 8pt (space2) for comfortable tap targets and spacing.
- **Typography:** Scale supports Dynamic Type; use semantic sizes (`textBase`, `textLg`, etc.) and avoid fixed heights on text.
- **Motion:** Prefer `durationFast` (150ms) for micro, `durationNormal` (200ms) for default, `durationSlow` (300ms) for modals/sheets.
- **Colors:** Semantic tokens ensure contrast and correct appearance in light/dark; use `primary` and `primaryForeground` for CTAs.
- **Accessibility:** Support VoiceOver labels, sufficient contrast (semantic colors are chosen for this), and Reduce Motion.

## Files

- `types.ts` — Theme and token types
- `palette.ts` — Brand (violet) and neutral hex palettes
- `semantic.ts` — Light/dark semantic color sets
- `status-colors.ts` — Success, warning, destructive, info
- `typography.ts` — Font and size scale
- `spacing.ts` — 4px spacing scale
- `radius.ts` — Border radius scale
- `motion.ts` — Duration and easing
- `shadow.ts` — Shadow presets (iOS/Android)
- `theme.ts` — `getTheme(mode)`
- `compat.ts` — Legacy shape for existing components (`theme.colors.text`, `palette`, `fontSize`, `shadow()`)
- `index.ts` — Public API

## Compatibility

Existing code that uses `theme.colors.text`, `theme.colors.surface`, `theme.palette`, `theme.fontSize`, `theme.shadow({ … })` continues to work via `themeWithCompat()`. New code should use semantic names: `foreground`, `card`, `primaryForeground`, `typography.textBase`, and shadow presets where possible.
