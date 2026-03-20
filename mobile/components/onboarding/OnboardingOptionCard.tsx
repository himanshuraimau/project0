/**
 * Selectable card (emoji + title + description) — true frosted glass.
 */

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import Animated from 'react-native-reanimated'
import { useTheme } from '@/lib/hooks/useTheme'
import { onboardingEntrance, usePressScale } from '@/lib/ui/auth-animations'

export type OnboardingOptionCardProps = {
  emoji: string
  title: string
  description: string
  accentColor?: string
  isSelected: boolean
  onPress: () => void
  entranceDelay?: number
  index?: number
}

export function OnboardingOptionCard({
  emoji,
  title,
  description,
  accentColor,
  isSelected,
  onPress,
  index = 0,
}: OnboardingOptionCardProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [scaleStyle, pressIn, pressOut] = usePressScale()

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

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
          styles.card,
          {
            borderColor: glassBorder,
            borderWidth: isSelected ? 1.5 : 1,
          },
        ]}
      >
        <BlurView
          intensity={isDark ? 20 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
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
            styles.emojiWrap,
            {
              backgroundColor: accentColor
                ?? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'),
            },
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[styles.title, { color: c.foreground, fontWeight: t.weightMedium }]}
          >
            {title}
          </Text>
          <Text
            style={[styles.desc, { color: c.mutedForeground }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderRadius: 16,
    minHeight: 76,
    overflow: 'hidden',
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24, lineHeight: 30 },
  textWrap: { flex: 1 },
  title: { fontSize: 16, lineHeight: 22, marginBottom: 2 },
  desc: { fontSize: 13, lineHeight: 18 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
