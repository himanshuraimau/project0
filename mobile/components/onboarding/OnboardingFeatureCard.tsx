import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from '@/lib/hooks/useTheme'
import { onboardingEntrance, usePressScale } from '@/lib/ui/auth-animations'

export type OnboardingFeatureCardProps = {
  icon: React.ReactNode
  label: string
  isSelected: boolean
  onPress: () => void
  entranceDelay?: number
  index?: number
}

export function OnboardingFeatureCard({
  icon,
  label,
  isSelected,
  onPress,
  index = 0,
}: OnboardingFeatureCardProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const isDark = mode === 'dark'
  const [scaleStyle, pressIn, pressOut] = usePressScale()

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const cardBg = isSelected
    ? (isDark ? 'rgba(79,59,231,0.1)' : 'rgba(79,59,231,0.04)')
    : (isDark ? 'rgba(255,255,255,0.04)' : '#fff')
  const cardBorder = isSelected
    ? c.primary
    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')

  return (
    <Animated.View
      entering={onboardingEntrance.option(index)}
      style={[scaleStyle, styles.wrapper]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: isSelected ? 1.5 : 1,
          },
        ]}
      >
        {/* Check badge */}
        <View
          style={[
            styles.checkBadge,
            isSelected
              ? { backgroundColor: c.primary, borderWidth: 0 }
              : {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={11} color={c.primaryForeground} />
          )}
        </View>

        <View style={styles.iconWrap}>{icon}</View>
        <Text
          style={[styles.label, { color: c.foreground, fontWeight: t.weightMedium }]}
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
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: { marginBottom: 10 },
  label: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
})
