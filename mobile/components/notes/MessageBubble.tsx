import React from 'react'
import { styled, YStack, Text } from 'tamagui'

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

// Styled components for message bubbles using Tamagui
const MessageContainer = styled(YStack, {
  width: '100%',
  marginVertical: 5,
  variants: {
    align: {
      left: {
        alignItems: 'flex-start',
      },
      right: {
        alignItems: 'flex-end',
      },
    },
  } as const,
})

const BotBubble = styled(YStack, {
  backgroundColor: '$botBubble',
  borderRadius: 19,
  maxWidth: '77%',
  paddingVertical: 12,
  paddingHorizontal: 14,
})

const UserBubble = styled(YStack, {
  backgroundColor: '$userBubble',
  borderRadius: 21,
  maxWidth: '65%',
  paddingVertical: 12,
  paddingHorizontal: 14,
})

const BotText = styled(Text, {
  color: '$textDark',
  fontSize: 15.5,
  lineHeight: 23.25,
})

const UserText = styled(Text, {
  color: '#FFFFFF',
  fontSize: 15.5,
  lineHeight: 21.7,
})

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
  const accessibilityLabel = isUser
    ? `You said, ${message.text}`
    : `Bot says, ${message.text}`

  const Bubble = isUser ? UserBubble : BotBubble
  const MessageText = isUser ? UserText : BotText

  return (
    <MessageContainer align={isUser ? 'right' : 'left'}>
      <Bubble
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="text"
      >
        <MessageText>{message.text}</MessageText>
      </Bubble>
    </MessageContainer>
  )
}
