import { BrutalistTheme, ThemeMode, getTheme } from '@/lib/constants/Colors'
import React, { createContext, useContext, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'

type ThemeContextValue = {
  mode: ThemeMode
  theme: BrutalistTheme
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const ThemeProvider: React.FC<{ children: React.ReactNode; forceMode?: ThemeMode }> = ({
  children,
  forceMode,
}) => {
  const system = useColorScheme()
  const initialMode: ThemeMode = forceMode ?? (system === 'dark' ? 'light' : 'light')
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  const theme = useMemo(() => getTheme(mode), [mode])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme,
      setMode,
      toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
    }),
    [mode, theme]
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


