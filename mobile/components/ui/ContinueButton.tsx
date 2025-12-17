import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native'

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
  // Disabled state: white background, gray text, not clickable
  if (disabled) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        disabled={true}
        style={[styles.disabledButton, style]}
      >
        <Text style={styles.disabledButtonText}>
          {text} →
        </Text>
      </TouchableOpacity>
    )
  }

  // Enabled state: purple gradient, white text, clickable
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={false}
      style={[{ width: '100%' }, style]}
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

  // Disabled state (white background, not clickable)
  disabledButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 30,
  },
  disabledButtonText: {
    fontFamily: 'Arimo',
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 24,
    color: '#AAAAAA',
  },
})
