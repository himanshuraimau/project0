import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface ChatHeaderProps {
  onBackPress?: () => void
  title?: string
}

export default function ChatHeader({ onBackPress, title = 'Chat' }: ChatHeaderProps) {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const handleBack = () => {
    if (onBackPress) onBackPress()
    else router.back()
  }

  return (
    <View style={[styles.header, { backgroundColor: isDark ? neutral[950] : '#fff', borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
      <Pressable
        onPress={handleBack}
        hitSlop={12}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        accessibilityLabel="Back"
      >
        <Feather name="arrow-left" size={24} color={c.foreground} />
      </Pressable>

      <View style={styles.titleWrap}>
        <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      </View>

      <View style={{ width: 24 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
})
