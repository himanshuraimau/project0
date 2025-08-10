// Re-export (compat layer) so existing imports keep working
export { palette } from '@/lib/theme/palette'
export { getTheme, themeDark, themeLight } from '@/lib/theme/semantic'
export { brutalistShadowFactory } from '@/lib/theme/shadow'
export type {
    BrutalistShadowOptions, BrutalistTheme, ColorHex,
    ColorPalette, FontScale, RadiusScale, SemanticColors,
    SpacingScale, ThemeMode
} from '@/lib/theme/types'
export { tokens } from '@/lib/tokens'

const DefaultExportTheme = undefined as unknown as never
export default DefaultExportTheme


