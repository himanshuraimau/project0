# Flinote Theme & UI — Mobile App Reference

Use this file as the **single source of truth** to apply Flinote’s theme and UI on the mobile app (React Native / Expo). All values are copy-paste ready.

**Brand:** Violet (oklch, hue 278°). One brand color; primary and accent derive from the violet scale.

---

## 1. Theme modes

| Mode   | When to use |
|--------|-------------|
| `light` | Default; use when user prefers light or no preference. |
| `dark`  | Use when user prefers dark. |
| `system` | Follow device appearance (resolve to `light` or `dark`). |

Apply the **Light** or **Dark** token set below based on the active mode.

---

## 2. Brand palette (shared)

Use for gradients, borders, or when semantic tokens don’t fit. Prefer semantic tokens in UI.

| Token      | Value (oklch) |
|------------|----------------|
| `brand-50` | `0.982 0.012 278` |
| `brand-100`| `0.952 0.032 278` |
| `brand-200`| `0.902 0.068 278` |
| `brand-300`| `0.808 0.128 278` |
| `brand-400`| `0.688 0.188 278` |
| `brand-500`| `0.576 0.232 278` |
| `brand-600`| `0.498 0.243 278` |
| `brand-700`| `0.432 0.218 278` |
| `brand-800`| `0.368 0.178 278` |
| `brand-900`| `0.308 0.132 278` |
| `brand-950`| `0.218 0.088 278` |

**Format:** `oklch(L C H)` — e.g. `brand-500` = `oklch(0.576 0.232 278)`.

---

## 3. Neutral palette (shared)

Surfaces and text; slight violet tint. Use semantic tokens in components when possible.

| Token       | Value (oklch) |
|------------|----------------|
| `neutral-0`  | `1 0 0` |
| `neutral-50` | `0.988 0.002 278` |
| `neutral-100`| `0.968 0.004 278` |
| `neutral-200`| `0.928 0.006 278` |
| `neutral-300`| `0.868 0.008 278` |
| `neutral-400`| `0.648 0.01 278` |
| `neutral-500`| `0.548 0.01 278` |
| `neutral-600`| `0.448 0.01 278` |
| `neutral-700`| `0.368 0.008 278` |
| `neutral-800`| `0.278 0.006 278` |
| `neutral-900`| `0.208 0.004 278` |
| `neutral-950`| `0.128 0.004 278` |

---

## 4. Semantic colors by theme

Use these names in the app (e.g. `colors.background`, `colors.primary`). Values reference brand/neutral above.

### 4.1 Light theme

| Token | Value / reference |
|-------|-------------------|
| `background` | `neutral-0` |
| `foreground` | `neutral-950` |
| `card` | `neutral-50` |
| `cardForeground` | `neutral-950` |
| `popover` | `neutral-0` |
| `popoverForeground` | `neutral-950` |
| `primary` | `brand-600` |
| `primaryForeground` | `oklch(0.99 0.005 278)` |
| `secondary` | `brand-100` |
| `secondaryForeground` | `brand-900` |
| `muted` | `neutral-100` |
| `mutedForeground` | `neutral-500` |
| `accent` | `brand-50` |
| `accentForeground` | `brand-900` |
| `destructive` | `color-destructive` (see Status) |
| `destructiveForeground` | `color-destructive-foreground` |
| `border` | `neutral-200` |
| `input` | `neutral-200` |
| `ring` | `brand-500` |
| `sidebar` | `neutral-50` |
| `sidebarForeground` | `neutral-950` |
| `sidebarPrimary` | `brand-600` |
| `sidebarPrimaryForeground` | `oklch(0.99 0.005 278)` |
| `sidebarAccent` | `neutral-0` |
| `sidebarAccentForeground` | `neutral-950` |
| `sidebarBorder` | `neutral-200` |
| `sidebarRing` | `brand-500` |

**Charts (light):**  
`chart1`: brand-600, `chart2`: brand-400, `chart3`: brand-300,  
`chart4`: `oklch(0.6559 0.2118 354.3084)`, `chart5`: `oklch(0.7227 0.192 149.5793)`.

### 4.2 Dark theme

| Token | Value / reference |
|-------|-------------------|
| `background` | `neutral-950` |
| `foreground` | `neutral-50` |
| `card` | `neutral-900` |
| `cardForeground` | `neutral-50` |
| `popover` | `neutral-900` |
| `popoverForeground` | `neutral-50` |
| `primary` | `brand-400` |
| `primaryForeground` | `neutral-950` |
| `secondary` | `brand-900` |
| `secondaryForeground` | `neutral-50` |
| `muted` | `neutral-800` |
| `mutedForeground` | `neutral-400` |
| `accent` | `neutral-800` |
| `accentForeground` | `neutral-50` |
| `destructive` | `oklch(0.65 0.2 25)` |
| `destructiveForeground` | `oklch(0.99 0.01 25)` |
| `border` | `neutral-700` |
| `input` | `neutral-700` |
| `ring` | `brand-400` |
| `sidebar` | `neutral-900` |
| `sidebarForeground` | `neutral-50` |
| `sidebarPrimary` | `brand-400` |
| `sidebarPrimaryForeground` | `neutral-950` |
| `sidebarAccent` | `neutral-800` |
| `sidebarAccentForeground` | `neutral-50` |
| `sidebarBorder` | `neutral-700` |
| `sidebarRing` | `brand-400` |

**Charts (dark):**  
`chart1`: brand-400, `chart2`: brand-300, `chart3`: brand-500,  
`chart4`: `oklch(0.7253 0.1752 349.7607)`, `chart5`: `oklch(0.8003 0.1821 151.711)`.

---

## 5. Status colors (shared)

Use for success, warning, error, info. Same in light and dark.

| Token | Value (oklch) |
|-------|----------------|
| `success` | `0.65 0.19 155` |
| `successForeground` | `0.99 0.01 155` |
| `warning` | `0.78 0.18 75` |
| `warningForeground` | `0.25 0.05 75` |
| `destructive` (status) | `0.58 0.22 25` |
| `destructiveForeground` | `0.99 0.01 25` |
| `info` | `0.62 0.19 250` |
| `infoForeground` | `0.99 0.01 250` |

---

## 6. Typography

### 6.1 Font families

| Token | Value |
|-------|--------|
| `fontSans` | `"DM Sans", system-ui, sans-serif` |
| `fontMono` | `"Space Mono", monospace` |
| `fontDisplay` | Same as `fontSans` |

### 6.2 Font sizes (base 16px)

| Token | rem | px |
|-------|-----|-----|
| `textXs` | 0.75 | 12 |
| `textSm` | 0.875 | 14 |
| `textBase` | 1 | 16 |
| `textLg` | 1.125 | 18 |
| `textXl` | 1.25 | 20 |
| `text2xl` | 1.5 | 24 |
| `text3xl` | 1.875 | 30 |
| `text4xl` | 2.25 | 36 |
| `text5xl` | 3 | 48 |
| `text6xl` | 3.75 | 60 |

### 6.3 Line height

| Token | Value |
|-------|--------|
| `leadingTight` | 1.25 |
| `leadingSnug` | 1.375 |
| `leadingNormal` | 1.5 |
| `leadingRelaxed` | 1.625 |
| `leadingLoose` | 2 |
| `leading7` | 1.75 |

### 6.4 Letter spacing

| Token | Value |
|-------|--------|
| `trackingTighter` | -0.05em |
| `trackingTight` | -0.025em |
| `trackingNormal` | 0 |
| `trackingWide` | 0.025em |
| `trackingWider` | 0.05em |
| `trackingWidest` | 0.1em |

### 6.5 Font weight

| Token | Value |
|-------|--------|
| `weightNormal` | 400 |
| `weightMedium` | 500 |
| `weightSemibold` | 600 |
| `weightBold` | 700 |

---

## 7. Spacing (4px base)

| Token | rem | px |
|-------|-----|-----|
| `space0` | 0 | 0 |
| `spacePx` | — | 1 |
| `space0_5` | 0.125 | 2 |
| `space1` | 0.25 | 4 |
| `space2` | 0.5 | 8 |
| `space3` | 0.75 | 12 |
| `space4` | 1 | 16 |
| `space5` | 1.25 | 20 |
| `space6` | 1.5 | 24 |
| `space8` | 2 | 32 |
| `space10` | 2.5 | 40 |
| `space12` | 3 | 48 |
| `space16` | 4 | 64 |
| `space20` | 5 | 80 |
| `space24` | 6 | 96 |

---

## 8. Border radius

| Token | rem | px |
|-------|-----|-----|
| `radiusNone` | 0 | 0 |
| `radius2xs` | 0.25 | 4 |
| `radiusXs` | 0.375 | 6 |
| `radiusSm` | 0.5 | 8 |
| `radiusMd` | 0.75 | 12 |
| `radiusLg` | 1 | 16 |
| `radiusXl` | 1.25 | 20 |
| `radius2xl` | 1.5 | 24 |
| `radius3xl` | 2 | 32 |
| `radiusFull` | 9999 | full/pill |

**Default radius in UI:** `radiusLg` (16px).

---

## 9. Motion

Respect `prefers-reduced-motion` (shorten or disable animations when set).

### 9.1 Duration

| Token | Value |
|-------|--------|
| `durationInstant` | 0ms |
| `durationFast` | 150ms |
| `durationNormal` | 200ms |
| `durationSlow` | 300ms |
| `durationSlower` | 500ms |

### 9.2 Easing

| Token | Value |
|-------|--------|
| `easeDefault` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `easeIn` | `cubic-bezier(0.4, 0, 1, 1)` |
| `easeOut` | `cubic-bezier(0, 0, 0.2, 1)` |
| `easeInOut` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `easeBounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `easeSmooth` | `cubic-bezier(0.33, 1, 0.68, 1)` |

**Usage:** Micro = `durationFast`, default = `durationNormal`, modals/panels = `durationSlow`.

---

## 10. Elevation / shadows

Shadows are violet-tinted in light; neutral in dark. On mobile, map to platform elevation or shadow props.

### 10.1 Light theme

| Token | Value (conceptual) |
|-------|---------------------|
| `shadow2xs` | 0 1px 1px oklch(0.2 0.05 278 / 0.03) |
| `shadowXs` | 0 1px 2px oklch(0.2 0.05 278 / 0.04) |
| `shadowSm` | 0 2px 4px + 0 2px 6px (violet tint ~0.04–0.06) |
| `shadowMd` | 0 4px 8px + 0 4px 12px |
| `shadowLg` | 0 8px 16px + 0 8px 24px |
| `shadowXl` | 0 16px 32px + 0 16px 48px |
| `shadow2xl` | 0 24px 48px + 0 24px 64px |
| `shadowBrand` | 0 4px 14px oklch(0.576 0.232 278 / 0.25) |
| `shadowBrandLg` | 0 8px 24px oklch(0.576 0.232 278 / 0.3) |

### 10.2 Dark theme

Same structure; use black-based shadows, e.g. `oklch(0 0 0 / 0.15–0.45)`. Brand shadows: same violet with higher opacity (e.g. 0.35, 0.4).

### 10.3 React Native mapping (example)

- **iOS:** `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`.
- **Android:** `elevation`.
- Derive numeric values from the px values above; use theme `background` or `neutral-900` for `shadowColor` where needed.

---

## 11. Component usage (semantic)

- **Backgrounds:** `background`, `card`, `popover`, `muted`, `accent`, `sidebar`.
- **Text:** `foreground`, `cardForeground`, `mutedForeground`, `primaryForeground`, `accentForeground`.
- **CTAs / links:** `primary`, `primaryForeground`; focus/ring: `ring`.
- **Borders / inputs:** `border`, `input`, `ring`.
- **Destructive:** `destructive`, `destructiveForeground`.
- **Status:** `success`, `warning`, `destructive`, `info` (and their foregrounds).

Use semantic names in the app (e.g. `colors.primary`) so switching light/dark only swaps the token set.

---

## 12. Checklist for applying on mobile

- [ ] Implement **Light** and **Dark** semantic color sets (Section 4).
- [ ] Add **brand** and **neutral** palettes (Sections 2–3) for any custom UI.
- [ ] Add **status** colors (Section 5).
- [ ] Wire **typography** scale and font families (Section 6).
- [ ] Use **spacing** and **radius** tokens (Sections 7–8) for layout and components.
- [ ] Use **motion** tokens for animations; respect reduced motion (Section 9).
- [ ] Map **shadows** to platform elevation/shadow APIs (Section 10).
- [ ] Resolve `system` theme to device appearance and apply the matching set above.

---

*Single brand color: **Violet** (oklch, hue 278°). All primary and accent usage comes from the violet scale.*
