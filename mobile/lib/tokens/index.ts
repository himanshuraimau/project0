import { themeWithCompat } from '@/lib/design-system'
import type { ThemeMode } from '@/lib/design-system'

export const tokens = {
  card: (mode: ThemeMode = 'light') => {
    const t = themeWithCompat(mode)
    return {
      backgroundColor: t.colors.surface,
      borderColor: t.colors.border,
      borderWidth: t.borderWidth.brutal,
      borderRadius: t.radius.brutal,
      padding: t.spacing.xl,
      ...t.shadow({ offset: 4, opacity: 0.35 }),
    } as const
  },

  button: (mode: ThemeMode = 'light') => {
    const t = themeWithCompat(mode)
    return {
      container: {
        backgroundColor: t.colors.primary,
        borderColor: t.colors.border,
        borderWidth: t.borderWidth.brutal,
        borderRadius: t.radius.brutal,
        paddingVertical: 12,
        paddingHorizontal: 22,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        ...t.shadow({ offset: 4, opacity: 0.35 }),
      },
      text: {
        color: t.colors.primaryText,
        fontSize: t.fontSize.md,
        fontWeight: '700' as const,
      },
    }
  },

  socialButton: (mode: ThemeMode = 'light') => {
    const t = themeWithCompat(mode)
    return {
      container: {
        backgroundColor: t.colors.surface,
        borderColor: t.colors.border,
        borderWidth: t.borderWidth.brutal,
        borderRadius: t.radius.brutal,
        paddingVertical: 12,
        paddingHorizontal: 22,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        ...t.shadow({ offset: 4, opacity: 0.35 }),
      },
      text: {
        color: t.colors.text,
        fontSize: t.fontSize.md,
        fontWeight: '700' as const,
      },
    }
  },

  headline: (mode: ThemeMode = 'light') => {
    const t = themeWithCompat(mode)
    return {
      color: t.colors.text,
      fontSize: t.fontSize['2xl'],
      fontWeight: '800' as const,
      letterSpacing: 0.2,
    } as const
  },

  input: (mode: ThemeMode = 'light') => {
    const t = themeWithCompat(mode)
    return {
      container: {
        backgroundColor: t.colors.inputBackground,
        borderColor: t.colors.border,
        borderWidth: t.borderWidth.brutal,
        borderRadius: t.radius.brutal,
        padding: t.spacing.md,
        ...t.shadow({ offset: 3, opacity: 0.25 }),
      },
      input: {
        color: t.colors.text,
        fontSize: t.fontSize.md,
      },
      focusedContainer: {
        borderColor: t.colors.primary,
      },
    } as const
  },

  link: (mode: ThemeMode = 'light') => {
    const t = themeWithCompat(mode)
    return {
      color: t.colors.accent,
      textDecorationLine: 'none' as const,
    }
  },
}

export type Tokens = typeof tokens


