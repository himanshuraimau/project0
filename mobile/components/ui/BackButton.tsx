import React from 'react'
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'

interface BackButtonProps {
  onPress?: () => void
  style?: ViewStyle
  iconColor?: string
  iconSize?: number
}

export default function BackButton({
  onPress,
  style,
  iconColor,
  iconSize = 24
}: BackButtonProps) {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.back()
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        {
          width: 48,
          height: 48,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : c.card,
          borderWidth: 0.5,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
          borderRadius: 24,
          shadowColor: isDark ? 'transparent' : '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 3,
          elevation: isDark ? 0 : 2,
        },
        style,
      ]}
    >
      <Feather name="arrow-left" size={iconSize} color={iconColor || c.foreground} />
    </TouchableOpacity>
  )
}
