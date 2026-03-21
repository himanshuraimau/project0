import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import type { EditorHeaderProps } from '@/lib/editor/types'

export default function EditorHeader({ onBack, onSave, saving }: EditorHeaderProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  return (
    <View style={[styles.header, { backgroundColor: isDark ? neutral[950] : '#fff', borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        accessibilityLabel="Go back"
      >
        <Feather name="arrow-left" size={24} color={c.foreground} />
      </Pressable>

      <Text style={[styles.title, { color: c.foreground }]}>Edit Note</Text>

      <Pressable
        onPress={onSave}
        disabled={saving}
        hitSlop={12}
        style={({ pressed }) => [
          styles.saveBtn,
          {
            backgroundColor: c.primary,
            opacity: saving ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
        accessibilityLabel={saving ? 'Saving note' : 'Save note'}
      >
        {saving ? (
          <ActivityIndicator size="small" color={c.primaryForeground} />
        ) : (
          <Feather name="check" size={18} color={c.primaryForeground} />
        )}
      </Pressable>
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
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
