import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

export interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const isUser = message.isUser

  const userBg = c.primary
  const botBg = isDark ? neutral[800] : '#f0f0f5'

  const accessibilityLabel = isUser
    ? `You said, ${message.text}`
    : `Bot says, ${message.text}`

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.botContainer]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: userBg }]
            : [styles.botBubble, { backgroundColor: botBg }],
        ]}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="text"
      >
        <Text
          style={[
            styles.text,
            isUser
              ? { color: c.primaryForeground }
              : { color: c.foreground },
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  botContainer: {
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  botBubble: {
    borderRadius: 20,
    borderTopLeftRadius: 6,
    maxWidth: '80%',
  },
  userBubble: {
    borderRadius: 20,
    borderTopRightRadius: 6,
    maxWidth: '75%',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
})
