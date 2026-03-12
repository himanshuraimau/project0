/**
 * Multi-select feature card for onboarding grid (Step4).
 * Theme-aware: semantic tokens, theme.shadow(), design-system radius/spacing.
 */

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useTheme } from '@/lib/hooks/useTheme'
import { radius as dsRadius, spacing as dsSpacing } from '@/lib/design-system'
import { usePressScale } from '@/lib/ui/auth-animations'

export type OnboardingFeatureCardProps = {
  icon: React.ReactNode
  label: string
  isSelected: boolean
  onPress: () => void
  entranceDelay?: number
}

export function OnboardingFeatureCard({
  icon,
  label,
  isSelected,
  onPress,
  entranceDelay = 0,
}: OnboardingFeatureCardProps) {
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
      entering={entranceDelay > 0 ? FadeIn.duration(260).delay(entranceDelay).springify() : undefined}
      style={[scaleStyle, styles.wrapper]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? c.accent : c.card,
            borderRadius: dsRadius.radiusXl,
            borderWidth: 1.5,
            borderColor: isSelected ? c.primary : c.border,
          },
          cardShadow,
        ]}
      >
        {isSelected && (
          <View
            style={[
              styles.checkBadge,
              {
                backgroundColor: c.primary,
                borderRadius: dsRadius.radiusFull,
              },
            ]}
          >
            <Ionicons name="checkmark" size={12} color={c.primaryForeground} />
          </View>
        )}
        <View style={styles.iconWrap}>{icon}</View>
        <Text
          style={[
            styles.label,
            {
              color: c.foreground,
              fontSize: t.textSm,
              fontWeight: t.weightMedium,
            },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: { width: '47%' },
  card: {
    aspectRatio: 1,
    padding: dsSpacing.space4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: { marginBottom: 10 },
  label: { textAlign: 'center', lineHeight: 20 },
})
