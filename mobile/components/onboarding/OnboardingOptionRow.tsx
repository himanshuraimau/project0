import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
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

  const rowBg = isSelected
    ? (isDark ? 'rgba(79,59,231,0.1)' : 'rgba(79,59,231,0.04)')
    : (isDark ? 'rgba(255,255,255,0.04)' : '#fff')
  const rowBorder = isSelected
    ? c.primary
    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')

  const defaultIconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'

  return (
    <Animated.View entering={onboardingEntrance.option(index)} style={scaleStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.row,
          {
            backgroundColor: rowBg,
            borderColor: rowBorder,
            borderWidth: isSelected ? 1.5 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: iconBackgroundColor ?? defaultIconBg },
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

        <View
          style={[
            styles.radio,
            isSelected
              ? { backgroundColor: c.primary, borderWidth: 0 }
              : {
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 14,
    borderRadius: 16,
    minHeight: 62,
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
