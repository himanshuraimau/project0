import {
  ThemeMode,
  ThemePreference,
  ThemeWithCompat,
  themeWithCompat,
} from '@/lib/design-system'
import React, { createContext, useContext, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'

type ThemeContextValue = {
  /** Resolved mode (light or dark); when preference is 'system', follows device */
  mode: ThemeMode
  /** User preference: light | dark | system */
  preference: ThemePreference
  theme: ThemeWithCompat
  setMode: (mode: ThemeMode) => void
  setPreference: (preference: ThemePreference) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveMode(preference: ThemePreference, system: 'light' | 'dark' | null | undefined): ThemeMode {
  if (preference === 'system') return system === 'dark' ? 'dark' : 'light'
  return preference
}

export const ThemeProvider: React.FC<{
  children: React.ReactNode
  /** Force resolved mode (overrides preference) */
  forceMode?: ThemeMode
}> = ({ children, forceMode }) => {
  const system = useColorScheme()
  const [preference, setPreference] = useState<ThemePreference>('light')
  const mode: ThemeMode = forceMode ?? resolveMode(preference, system)
  const theme = useMemo(() => themeWithCompat(mode), [mode])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      preference,
      theme,
      setMode: (m) => setPreference(m),
      setPreference,
      toggleMode: () => setPreference((p) => (resolveMode(p, system ?? null) === 'light' ? 'dark' : 'light')),
    }),
    [mode, preference, theme, system]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
