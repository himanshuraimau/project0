# Project0 Style Guide

## Overview

Project0 uses **Tailwind CSS v4** with **shadcn/ui** components and a **sophisticated OKLCH color palette** with seamless dark mode support. Design emphasizes **super clean aesthetics** with **generous curves** and **spacious layouts**.

## Color System (OKLCH)

### Light Mode
```css
--background: oklch(0.9789 0.0082 121.6272);     /* Light cream */
--foreground: oklch(0 0 0);                      /* Pure black */
--primary: oklch(0.5106 0.2301 276.9656);        /* Rich purple */
--primary-foreground: oklch(1.0000 0 0);         /* Pure white */
--secondary: oklch(0.7038 0.1230 182.5025);      /* Soft teal */
--secondary-foreground: oklch(1.0000 0 0);       /* Pure white */
--accent: oklch(0.7686 0.1647 70.0804);          /* Warm yellow */
--accent-foreground: oklch(0 0 0);               /* Pure black */
--muted: oklch(0.9551 0 0);                      /* Light gray */
--muted-foreground: oklch(0.3211 0 0);           /* Dark gray */
--card: oklch(1.0000 0 0);                       /* Pure white */
--card-foreground: oklch(0 0 0);                 /* Pure black */
--border: oklch(0 0 0);                          /* Pure black */
--destructive: oklch(0.6368 0.2078 25.3313);     /* Warm red */
--destructive-foreground: oklch(1.0000 0 0);     /* Pure white */
```

### Dark Mode
```css
--background: oklch(0 0 0);                      /* Pure black */
--foreground: oklch(1.0000 0 0);                 /* Pure white */
--primary: oklch(0.6801 0.1583 276.9349);        /* Bright purple */
--primary-foreground: oklch(0 0 0);              /* Pure black */
--secondary: oklch(0.7845 0.1325 181.9120);      /* Bright teal */
--secondary-foreground: oklch(0 0 0);            /* Pure black */
--accent: oklch(0.8790 0.1534 91.6054);          /* Bright yellow */
--accent-foreground: oklch(0 0 0);               /* Pure black */
--muted: oklch(0.3211 0 0);                      /* Dark gray */
--muted-foreground: oklch(0.8452 0 0);           /* Light gray */
--card: oklch(0.2455 0.0217 257.2823);           /* Dark blue-gray */
--card-foreground: oklch(1.0000 0 0);            /* Pure white */
--border: oklch(0.4459 0 0);                     /* Medium gray */
--destructive: oklch(0.7106 0.1661 22.2162);     /* Bright red */
--destructive-foreground: oklch(0 0 0);          /* Pure black */
```

### Chart Colors (Both Modes)
```css
--chart-1: Primary color variant
--chart-2: Secondary color variant  
--chart-3: Accent color variant
--chart-4: Destructive color variant
--chart-5: Success color variant
```

## Typography

- **Font**: Inter (primary), with system fallbacks
- **Sizes**: `text-5xl` (titles), `text-2xl` (headers), `text-base` (body)
- **Weights**: `font-medium` (buttons), `font-semibold` (headings), `font-bold` (titles)
- **Line Height**: `leading-relaxed` for body text, `leading-tight` for headings

## Spacing & Layout (Super Clean & Spacious)

- **Container**: `max-w-6xl mx-auto px-6 sm:px-8 lg:px-12` (more generous padding)
- **Gaps**: `gap-8` (standard), `gap-12` (large), `gap-16` (extra large)
- **Padding**: `p-12` (cards), `px-8 py-4` (buttons), `p-6` (small components)
- **Margins**: `mb-12` (sections), `mb-8` (components), `mb-6` (elements)
- **Border Radius**: `rounded-2xl` (default), `rounded-3xl` (cards), `rounded-full` (pills)

## Component Patterns (Clean & Consistent)

### Buttons (Using Global CSS Variables)

```tsx
// Primary - Clean with theme colors
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-8 py-4 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300">

// Secondary - Outline style with theme colors  
<Button variant="outline" className="border-2 border-primary hover:bg-primary/5 text-primary rounded-2xl px-8 py-4 text-lg font-medium hover:shadow-lg transition-all duration-300">

// Accent - Using accent color
<Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl px-8 py-4 shadow-lg">
```

### Cards (Ultra Clean & Spacious)

```tsx
<Card className="rounded-3xl border-0 p-12 shadow-xl hover:shadow-2xl transition-all duration-300 bg-card text-card-foreground">
```

### Badges (Theme Consistent)

```tsx
<Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-6 py-2 text-sm font-medium">
```

### Background Elements (Subtle & Themed)

```tsx
// Gradient backgrounds
<div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />

// Floating elements
<div className="w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse" />
<div className="w-40 h-40 rounded-full bg-secondary/20 blur-3xl animate-pulse delay-1000" />
<div className="w-24 h-24 rounded-full bg-accent/30 blur-2xl animate-pulse delay-500" />
```

### Typography (Theme Aware)

```tsx
// Headings with gradient text
<h1 className="bg-gradient-to-br from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
  Main Title
</h1>
<span className="text-primary">Accent Text</span>

// Body text
<p className="text-muted-foreground">Description text</p>

// Statistics/Numbers
<div className="text-3xl font-bold text-primary">10,000+</div>
<div className="text-3xl font-bold text-secondary-foreground">100+</div>
<div className="text-3xl font-bold text-accent-foreground">25%</div>
```

## Advanced Spacing System

### Component Spacing (Extra Generous)
- **Button spacing**: `space-x-8` between buttons
- **Card grids**: `gap-12 lg:gap-16`
- **Form elements**: `space-y-8`
- **Navigation items**: `gap-12`

### Micro-Spacing (Breathing Room)
- **Icon + text**: `gap-4`
- **Label + input**: `space-y-3`
- **Button groups**: `gap-6`

## Enhanced Border Radius System

```css
--radius-sm: 0.75rem;   /* 12px - Small components */
--radius-md: 1rem;      /* 16px - Standard buttons */
--radius-lg: 1.5rem;    /* 24px - Default (cards, large buttons) */
--radius-xl: 2rem;      /* 32px - Hero cards */
--radius-2xl: 2.5rem;   /* 40px - Feature cards */
--radius-full: 9999px;  /* Pill buttons, badges */
```

### Usage Guidelines
- **Buttons**: `rounded-2xl` (24px) for main actions
- **Cards**: `rounded-3xl` (32px+) for content containers
- **Small elements**: `rounded-xl` (16px) for chips, badges
- **Pill elements**: `rounded-full` for tags, status indicators

## States (Smooth & Clean)

- **Hover**: `hover:bg-primary/90`, `hover:shadow-xl`, `hover:-translate-y-1`
- **Focus**: `focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none`
- **Active**: `active:scale-98 active:shadow-lg`
- **Transitions**: `transition-all duration-300 ease-out`

## Layout Patterns (Ultra Spacious)

### Page Layout
```tsx
<div className="min-h-screen bg-background">
  <main className="max-w-6xl mx-auto px-8 py-16 space-y-16">
    {/* Generous vertical spacing */}
  </main>
</div>
```

### Grid Systems (Clean Gaps)
```tsx
// Card grids with generous spacing
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">

// Content grids
<div className="grid gap-8 lg:gap-12">
```

### Flex Layouts (Spacious)
```tsx
<div className="flex flex-col gap-12 lg:gap-16">
<div className="flex items-center justify-between gap-8">
```

## Responsive (Mobile-First Clean Design)

- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch targets**: Minimum 48px (`min-h-[48px]`) for extra comfort
- **Mobile padding**: `px-6` (mobile), `px-8` (tablet), `px-12` (desktop)
- **Mobile gaps**: `gap-6` (mobile), `gap-8` (tablet), `gap-12` (desktop)

## Color Usage Guidelines

### Primary Colors
- **Primary**: Used for main CTAs, navigation highlights, and key interactive elements
- **Secondary**: Used for secondary actions and background accents
- **Accent**: Used for highlights, badges, and attention-drawing elements

### Text Colors
- **Foreground**: Main text color
- **Muted-foreground**: Secondary text, descriptions, metadata
- **Primary/Secondary/Accent-foreground**: Text on colored backgrounds

### Background Elements
- **Background**: Main page background
- **Card**: Content container backgrounds
- **Muted**: Subtle background areas
- **Border**: Dividers and outlines

### Interactive States
- Use opacity variations for hover states (`/90`, `/80`)
- Use low opacity for subtle backgrounds (`/5`, `/10`, `/20`)
- Use `hover:shadow-xl` and `hover:-translate-y-1` for lift effects

## Brand Identity

- **Primary Brand**: Purple/violet theme (`oklch(0.5106 0.2301 276.9656)`)
- **Secondary Brand**: Teal theme (`oklch(0.7038 0.1230 182.5025)`)
- **Accent**: Warm yellow (`oklch(0.7686 0.1647 70.0804)`)
- **Success**: Chart-5 color for positive actions
- **Error**: Destructive color (`oklch(0.6368 0.2078 25.3313)`)

## Design System Principles

1. **Consistent Color Usage**: Always use CSS variables, never hardcoded colors
2. **Semantic Color Names**: Use `primary`, `secondary`, `accent` instead of color names
3. **Automatic Dark Mode**: All colors automatically adapt to dark mode
4. **Minimal Color Palette**: Stick to the core color system for consistency
5. **Opacity for Variations**: Use `/10`, `/20`, `/90` etc. for color variations
6. **Theme-aware Components**: All components use global CSS variables