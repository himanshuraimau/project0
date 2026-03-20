/**
 * Selectable option row — true frosted glass.
 * BlurView background, glass highlight border, satisfying selection.
 */

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import Animated from 'react-native-reanimated'
import { useTheme } from '@/lib/hooks/useTheme'
import { onboardingEntrance, usePressScale } from '@/lib/ui/auth-animations'

export type OnboardingOptionRowProps = {
  icon: React.ReactNode
  label: string
  subtitle?: string
  isSelected: boolean
  onPress: () => void
  entranceDelay?: number
  iconBackgroundColor?: string
  index?: number
}

export function OnboardingOptionRow({
  icon,
  label,
  subtitle,
  isSelected,
  onPress,
  iconBackgroundColor,
  index = 0,
}: OnboardingOptionRowProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [scaleStyle, pressIn, pressOut] = usePressScale()

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  // Glass tints
  const glassBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'
  const glassBorder = isSelected
    ? c.primary
    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)')
  const glassHighlight = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.35)'

  return (
    <Animated.View entering={onboardingEntrance.option(index)} style={scaleStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.row,
          {
            borderColor: glassBorder,
            borderWidth: isSelected ? 1.5 : 1,
          },
        ]}
      >
        {/* Glass backdrop */}
        <BlurView
          intensity={isDark ? 20 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
        {/* Glass fill + top highlight */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 16,
              backgroundColor: isSelected
                ? (isDark ? 'rgba(79,59,231,0.08)' : 'rgba(79,59,231,0.04)')
                : glassBg,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: glassHighlight,
            },
          ]}
        />

        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: iconBackgroundColor
                ?? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'),
            },
          ]}
        >
          {icon}
        </View>

        <View style={styles.labelWrap}>
          <Text
            style={[styles.label, { color: c.foreground, fontWeight: t.weightMedium }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle != null && (
            <Text
              style={[styles.subtitle, { color: c.mutedForeground }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Radio indicator */}
        <View
          style={[
            styles.radio,
            isSelected
              ? { backgroundColor: c.primary, borderWidth: 0 }
              : {
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                },
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={12} color={c.primaryForeground} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderRadius: 16,
    minHeight: 64,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: { flex: 1 },
  label: { fontSize: 16, lineHeight: 22 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
