export type ColorHex = `#${string}`

export type ColorPalette = {
  red: ColorHex
  redHover: ColorHex

  blue: ColorHex
  green: ColorHex
  orange: ColorHex
  violet: ColorHex

  black: ColorHex
  nearBlack: ColorHex
  white: ColorHex
  gray200: ColorHex
  gray300: ColorHex
  gray500: ColorHex
}

export type SemanticColors = {
  background: ColorHex
  surface: ColorHex
  surfaceAlt: ColorHex
  text: ColorHex
  mutedText: ColorHex
  border: ColorHex
  primary: ColorHex
  primaryText: ColorHex
  accent: ColorHex
  success: ColorHex
  warning: ColorHex
  danger: ColorHex
  inputBackground: ColorHex
}

export type SpacingScale = {
  none: 0
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export type RadiusScale = {
  none: number
  sm: number
  md: number
  lg: number
  xl: number
  brutal: number
}

export type FontScale = {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
  '3xl': number
}

export type BrutalistShadowOptions = {
  offset?: number
  opacity?: number
  color?: ColorHex
}

export interface BrutalistTheme {
  name: 'neo-brutalism-light' | 'neo-brutalism-dark'
  colors: SemanticColors
  palette: ColorPalette
  spacing: SpacingScale
  radius: RadiusScale
  fontSize: FontScale
  borderWidth: {
    thin: number
    thick: number
    brutal: number
  }
  shadow: (options?: BrutalistShadowOptions) => {
    shadowColor: string
    shadowOffset: { width: number; height: number }
    shadowOpacity: number
    shadowRadius: number
    elevation: number
  }
}

export type ThemeMode = 'light' | 'dark'


