import React, { useState, useRef } from 'react'
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  TextInput as TextInputType,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface InputBarProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  placeholder?: string
}

export default function InputBar({
  value,
  onChangeText,
  onSend,
  placeholder = 'Ask anything\u2026',
}: InputBarProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<TextInputType>(null)

  const hasContent = value.trim().length > 0

  const handleSend = () => {
    if (hasContent) onSend()
  }

  const inputBg = isDark ? neutral[800] : '#f0f0f5'
  const inputBorder = isFocused
    ? c.primary
    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')

  return (
    <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#fff', borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: inputBg,
            borderColor: inputBorder,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: c.foreground }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.mutedForeground}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          accessibilityLabel="Message input"
        />
        <Pressable
          onPress={handleSend}
          disabled={!hasContent}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: hasContent ? c.primary : 'transparent',
              opacity: hasContent ? (pressed ? 0.8 : 1) : 0.4,
            },
          ]}
          accessibilityLabel="Send message"
        >
          <Feather
            name="arrow-up"
            size={18}
            color={hasContent ? c.primaryForeground : c.mutedForeground}
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    letterSpacing: -0.1,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
