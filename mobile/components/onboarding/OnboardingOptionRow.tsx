/**
 * Selectable option row for onboarding. Theme-aware: all colors from semantic
 * tokens, shadows via theme.shadow(), radius/spacing from design-system scale.
 */

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useTheme } from '@/lib/hooks/useTheme'
import { radius as dsRadius, spacing as dsSpacing } from '@/lib/design-system'
import { usePressScale } from '@/lib/ui/auth-animations'

export type OnboardingOptionRowProps = {
  icon: React.ReactNode
  label: string
  subtitle?: string
  isSelected: boolean
  onPress: () => void
  entranceDelay?: number
  iconBackgroundColor?: string
}

export function OnboardingOptionRow({
  icon,
  label,
  subtitle,
  isSelected,
  onPress,
  entranceDelay = 0,
  iconBackgroundColor,
}: OnboardingOptionRowProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [scaleStyle, pressIn, pressOut] = usePressScale()

  const cardShadow = theme.shadow({ offset: 2, opacity: isDark ? 0.18 : 0.06 })

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Animated.View
      entering={entranceDelay > 0 ? FadeIn.duration(280).delay(entranceDelay).springify() : undefined}
      style={scaleStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.row,
          {
            backgroundColor: isSelected ? c.accent : c.card,
            borderRadius: dsRadius.radiusXl,
            borderWidth: 1.5,
            borderColor: isSelected ? c.primary : c.border,
          },
          cardShadow,
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: iconBackgroundColor ?? c.muted,
              borderRadius: dsRadius.radiusMd,
            },
          ]}
        >
          {icon}
        </View>

        <View style={styles.labelWrap}>
          <Text
            style={[
              styles.label,
              {
                color: c.foreground,
                fontWeight: t.weightMedium,
                fontSize: t.textBase,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle != null && (
            <Text
              style={[
                styles.subtitle,
                { color: c.mutedForeground, fontSize: t.textSm },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.checkBadge,
            {
              backgroundColor: isSelected ? c.primary : c.muted,
              borderRadius: dsRadius.radiusFull,
            },
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={14} color={c.primaryForeground} />
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
    paddingHorizontal: dsSpacing.space4,
    paddingVertical: 14,
    gap: dsSpacing.space3,
    minHeight: 68,
  },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: { flex: 1 },
  label: { lineHeight: 22 },
  subtitle: { marginTop: 2 },
  checkBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
