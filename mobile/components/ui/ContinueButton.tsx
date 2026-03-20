/**
 * Continue button — solid foreground fill, iOS style.
 * No gradients, no hardcoded colors. Theme-aware.
 */

import React from 'react'
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@/lib/hooks/useTheme'
import { usePressScale } from '@/lib/ui/auth-animations'
import Animated from 'react-native-reanimated'

interface ContinueButtonProps {
  onPress: () => void
  text?: string
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}

export function ContinueButton({
  onPress,
  text = 'Continue',
  style,
  disabled = false,
}: ContinueButtonProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [scaleStyle, pressIn, pressOut] = usePressScale()

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={disabled ? undefined : pressIn}
        onPressOut={disabled ? undefined : pressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: disabled
              ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
              : c.foreground,
            opacity: disabled ? 1 : pressed ? 0.85 : 1,
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.label,
            {
              color: disabled
                ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
                : c.background,
              fontWeight: t.weightSemibold,
            },
          ]}
        >
          {text}
        </Text>
        <Feather
          name="arrow-right"
          size={18}
          color={
            disabled
              ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
              : c.background
          }
        />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  label: { fontSize: 17 },
})
