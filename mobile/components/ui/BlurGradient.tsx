import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

interface BlurGradientProps {
  colors: readonly [string, string, ...string[]]
  width: number
  height: number
  top?: number
  bottom?: number
  left?: number
  right?: number
  opacity?: number
}

export const BlurGradient: React.FC<BlurGradientProps> = ({
  colors,
  width,
  height,
  top,
  bottom,
  left,
  right,
  opacity = 0.1,
}) => {
  // Simulate blur(64px) by creating multiple layers with different sizes and opacities
  // This creates a soft, diffused glow effect similar to Gaussian blur
  const blurLayers = [
    { scale: 1.3, opacity: 0.15 },
    { scale: 1.2, opacity: 0.2 },
    { scale: 1.1, opacity: 0.25 },
    { scale: 1.0, opacity: 0.3 },
    { scale: 0.9, opacity: 0.25 },
    { scale: 0.8, opacity: 0.2 },
  ]

  const containerStyle: ViewStyle = {
    position: 'absolute',
    width: width * 1.4, // Extra space for blur spread
    height: height * 1.4,
    top: top !== undefined ? top - (height * 0.2) : undefined,
    bottom: bottom !== undefined ? bottom - (height * 0.2) : undefined,
    left: left !== undefined ? left - (width * 0.2) : undefined,
    right: right !== undefined ? right - (width * 0.2) : undefined,
  }

  return (
    <View style={containerStyle}>
      {blurLayers.map((layer, index) => {
        const layerWidth = width * layer.scale
        const layerHeight = height * layer.scale
        const offsetX = (width * 1.4 - layerWidth) / 2
        const offsetY = (height * 1.4 - layerHeight) / 2
        
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: layerWidth,
              height: layerHeight,
              left: offsetX,
              top: offsetY,
            }}
          >
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                ...StyleSheet.absoluteFillObject,
                opacity: opacity * layer.opacity,
                borderRadius: 9999,
              }}
            />
          </View>
        )
      })}
    </View>
  )
}
