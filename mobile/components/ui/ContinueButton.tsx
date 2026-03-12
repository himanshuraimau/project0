import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native'
import { radius as dsRadius } from '@/lib/design-system'

interface ContinueButtonProps {
  onPress: () => void
  variant?: 'gradient' | 'white'
  text?: string
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}

export function ContinueButton({
  onPress,
  variant = 'gradient',
  text = 'Continue',
  style,
  disabled = false,
}: ContinueButtonProps) {
  if (disabled) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        disabled
        style={[styles.disabledButton, style]}
      >
        <Text style={styles.disabledText}>{text} →</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.touchable, style]}
    >
      <LinearGradient
        colors={['#4C57FF', '#9810FA']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.gradientText}>{text}</Text>
        <Text style={styles.gradientArrow}>→</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  touchable: { width: '100%' },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: dsRadius.radiusFull,
    shadowColor: 'rgba(76, 87, 255, 0.25)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  gradientText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginRight: 8,
  },
  gradientArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  disabledButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: dsRadius.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledText: {
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 24,
    color: '#C4C4C4',
  },
})
