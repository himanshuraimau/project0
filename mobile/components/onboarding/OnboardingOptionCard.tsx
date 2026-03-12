/**
 * Selectable card for onboarding (emoji + title + description).
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

export type OnboardingOptionCardProps = {
  emoji: string
  title: string
  description: string
  accentColor?: string
  isSelected: boolean
  onPress: () => void
  entranceDelay?: number
}

export function OnboardingOptionCard({
  emoji,
  title,
  description,
  accentColor,
  isSelected,
  onPress,
  entranceDelay = 0,
}: OnboardingOptionCardProps) {
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
        <View
          style={[
            styles.emojiSquircle,
            {
              backgroundColor: accentColor ?? c.muted,
              borderRadius: dsRadius.radiusMd,
            },
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[
              styles.title,
              {
                color: c.foreground,
                fontSize: t.textBase,
                fontWeight: t.weightMedium,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.description,
              {
                color: c.mutedForeground,
                fontSize: t.textSm,
              },
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    paddingVertical: 14,
    paddingHorizontal: dsSpacing.space4,
    gap: dsSpacing.space4,
  },
  emojiSquircle: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26, lineHeight: 32 },
  textWrap: { flex: 1 },
  title: { marginBottom: 2, lineHeight: 22 },
  description: { lineHeight: 20 },
  checkBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
