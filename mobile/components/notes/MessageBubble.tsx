import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

/**
 * ChatMessage interface representing a single message in the chat
 */
export interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface MessageBubbleProps {
  message: ChatMessage
}

/**
 * MessageBubble component - Displays a single chat message with sender-specific styling
 * 
 * Bot messages: Left-aligned, gray background (#F2F2F2), dark text (#222222)
 * User messages: Right-aligned, purple background (#7A2EFF), white text (#FFFFFF)
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5, 7.2, 7.3
 */
export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.isUser

  // Accessibility label based on sender type
  // Requirements 7.2, 7.3
  const accessibilityLabel = isUser
    ? `You said, ${message.text}`
    : `Bot says, ${message.text}`

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.botContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.botBubble,
        ]}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="text"
      >
        <Text
          style={[
            styles.text,
            isUser ? styles.userText : styles.botText,
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
    marginVertical: 5, // 10-12px gap between messages (5px top + 5px bottom = 10px)
  },
  // Bot message container - left aligned (Requirements 2.1)
  botContainer: {
    alignItems: 'flex-start',
  },
  // User message container - right aligned (Requirements 2.2)
  userContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  // Bot bubble styling (Requirements 2.1)
  botBubble: {
    backgroundColor: '#F2F2F2',
    borderRadius: 19, // 18-20px range
    maxWidth: '77%', // 75-80% range
  },
  // User bubble styling (Requirements 2.2)
  userBubble: {
    backgroundColor: '#7A2EFF',
    borderRadius: 21, // 20-22px range
    maxWidth: '65%', // 60-70% range
  },
  text: {
    fontSize: 15.5, // 15-16px range
  },
  // Bot text styling (Requirements 2.1, 2.4)
  botText: {
    color: '#222222',
    lineHeight: 23.25, // 15.5 * 1.5 = 23.25
  },
  // User text styling (Requirements 2.2, 2.4)
  userText: {
    color: '#FFFFFF',
    lineHeight: 21.7, // 15.5 * 1.4 = 21.7
  },
})
