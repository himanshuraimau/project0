import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface ContinueButtonProps {
  onPress: () => void
  variant?: 'gradient' | 'white'
  text?: string
  style?: StyleProp<ViewStyle>
}

export function ContinueButton({
  onPress,
  variant = 'gradient',
  text = 'Continue',
  style,
  disabled = false
}: ContinueButtonProps & { disabled?: boolean }) {
  if (variant === 'white') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={[styles.whiteButton, style, disabled && { opacity: 0.5 }]}
      >
        <Text style={styles.whiteButtonText}>{text} →</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[{ width: '100%' }, style, disabled && { opacity: 0.5 }]}
    >
      <LinearGradient
        colors={["#4C57FF", "#9810FA"]}
        style={styles.gradientButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.gradientButtonText}>{text}</Text>
        <Text style={styles.gradientButtonArrow}>→</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // Gradient variant (purple gradient)
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: 28,
    shadowColor: 'rgba(76, 87, 255, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 30,
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 24,
    marginRight: 8,
  },
  gradientButtonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  // White variant
  whiteButton: {
    width: '100%',
    height: 55.98,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 30,
  },
  whiteButtonText: {
    fontFamily: 'Arimo',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#000000',
  },
})
