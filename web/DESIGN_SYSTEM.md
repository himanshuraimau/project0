# Flinote Design System

Industry-standard design system with **violet** as the brand color. Tokens are the single source of truth; components use semantic names, not raw palette values.

---

## 1. Brand & color

### Brand palette (violet)

Use the **semantic tokens** in UI (`primary`, `accent`, `background`, etc.). Use raw `--brand-*` only for custom gradients or one-off brand moments.

| Token       | Usage |
|------------|--------|
| `--brand-50` … `--brand-950` | Violet scale (oklch, hue ~278°). 50 = lightest, 950 = darkest. |

### Semantic colors

| Token | Light | Dark | Use |
|-------|--------|------|-----|
| `background` | Neutral 0 | Neutral 950 | Page/surface |
| `foreground` | Neutral 950 | Neutral 50 | Body text |
| `primary` | Brand 600 | Brand 400 | CTAs, links, focus |
| `primary-foreground` | Near white | Near black | Text on primary |
| `accent` | Brand 50 | Neutral 800 | Subtle highlights, hover |
| `accent-foreground` | Brand 900 | Neutral 50 | Text on accent |
| `muted` / `muted-foreground` | Neutral 100/500 | Neutral 800/400 | Secondary text, captions |
| `card` / `card-foreground` | Surface + text | Same in dark | Cards, panels |
| `border` / `input` / `ring` | Neutrals / brand | Same in dark | Borders, inputs, focus ring |
| `destructive` | Red (oklch) | Dark red | Errors, destructive actions |

### Status (design tokens)

- `--color-success`, `--color-warning`, `--color-destructive`, `--color-info` (and `-foreground`) for success, warning, error, info.

### In components

- Prefer Tailwind semantic classes: `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`, etc.
- Avoid hardcoded hex or raw `--brand-*` in components unless you need a custom gradient or asset.

---

## 2. Typography

| Token | Value | Use |
|-------|--------|-----|
| `--font-sans` | DM Sans, system fallbacks | Body, UI |
| `--font-mono` | Space Mono, monospace fallbacks | Code |
| `--font-display` | DM Sans | Headings, marketing |

Sizes (design tokens): `--text-xs` (12px) through `--text-6xl` (48px).  
Line height: `--leading-tight` (1.25) to `--leading-loose` (2).  
Weight: `--weight-normal` (400) to `--weight-bold` (700).

In Tailwind, use `font-sans`, `font-mono`, `text-sm`, `leading-tight`, `font-semibold`, etc., which are wired to these tokens.

---

## 3. Spacing

4px base. Use Tailwind spacing: `p-4`, `gap-6`, `space-y-2`, etc.  
Design tokens: `--space-1` (4px) through `--space-24` (96px) for custom CSS.

---

## 4. Border radius

| Token | Value | Tailwind |
|-------|--------|----------|
| `--radius` (default) | 1rem (16px) | `rounded-lg` |
| `--radius-sm` | 8px | `rounded-md` |
| `--radius-md` | 12px | `rounded-lg` |
| `--radius-xl` | 20px | `rounded-xl` |
| `--radius-full` | 9999px | `rounded-full` |

Use `rounded-lg`, `rounded-full`, etc., so components stay consistent with the theme.

---

## 5. Motion

| Token | Value | Use |
|-------|--------|-----|
| `--duration-fast` | 150ms | Micro-interactions |
| `--duration-normal` | 200ms | Default transitions |
| `--duration-slow` | 300ms | Modals, panels |
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | Default |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful |
| `--ease-smooth` | cubic-bezier(0.33, 1, 0.68, 1) | Smooth ease-out |

Respect `prefers-reduced-motion` where appropriate (e.g. disable or shorten animations).

---

## 6. Elevation & shadows

Shadows are violet-tinted in light mode for brand consistency.

| Token | Use |
|-------|-----|
| `--shadow-xs` … `--shadow-2xl` | Standard elevation scale |
| `--shadow-brand` | Primary buttons, key CTAs |
| `--shadow-brand-lg` | Hero sections, cards |

Use Tailwind: `shadow-sm`, `shadow-md`, `shadow-lg`, etc.

---

## 7. File structure

- **`src/styles/design-tokens.css`** — Brand palette, neutrals, typography, spacing, radius, motion, shadows. Defines `:root` and `.dark` for token values.
- **`src/app/globals.css`** — Imports tokens, defines **semantic** theme (e.g. `--primary`, `--background`) for light/dark and Tailwind `@theme inline`.

---

## 8. Checklist for new UI

- [ ] Use semantic colors (`primary`, `accent`, `muted`, `foreground`, etc.), not raw `--brand-*` or hex.
- [ ] Use `font-sans` / `font-mono` and size/weight/leading from the type scale.
- [ ] Use spacing and radius from the system (`p-4`, `rounded-lg`, etc.).
- [ ] Use motion tokens for transitions; respect reduced motion when needed.
- [ ] Use `shadow-*` and `shadow-brand` for elevation and CTAs.

---

*Brand: **Violet** (oklch, hue 278°). Single brand color; all primary and accent usage derives from the violet scale.*
