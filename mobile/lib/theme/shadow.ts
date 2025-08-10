import { Platform } from 'react-native'
import type { BrutalistShadowOptions, ColorHex } from './types'

export function brutalistShadowFactory(defaultShadowColor: ColorHex) {
  return ({ offset = 4, opacity = 0.35, color }: BrutalistShadowOptions = {}) => {
    const shadowColor = color ?? defaultShadowColor
    const elevation = Math.max(2, Math.round(offset))
    return {
      shadowColor,
      shadowOffset: { width: offset, height: offset },
      shadowOpacity: opacity,
      shadowRadius: 0,
      elevation: Platform.select({ android: elevation, ios: 0, default: elevation }),
    }
  }
}


