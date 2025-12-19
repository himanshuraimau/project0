import React, { useState, useRef } from 'react'
import { TextInput as RNTextInput } from 'react-native'
import { styled, YStack, XStack, Input } from 'tamagui'
import { Feather } from '@expo/vector-icons'
import { Pressable } from 'react-native'

interface InputBarProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  placeholder?: string
}

// Styled components for input bar
const Container = styled(YStack, {
  paddingHorizontal: '$4',
  paddingVertical: 6,
  backgroundColor: '$background',
})

const InputContainer = styled(XStack, {
  alignItems: 'center',
  height: 44,
  borderRadius: 22,
  backgroundColor: '$background',
  paddingHorizontal: '$4',
  variants: {
    focused: {
      true: {
        borderWidth: 1.5,
        borderColor: '$borderFocus',
      },
      false: {
        borderWidth: 1,
        borderColor: '$borderDark',
      },
    },
  } as const,
})

const StyledInput = styled(Input, {
  flex: 1,
  fontSize: 16,
  color: '$text',
  paddingVertical: 0,
  borderWidth: 0,
  backgroundColor: 'transparent',
  outlineWidth: 0,
})

const SendButton = styled(Pressable, {
  width: 36,
  height: 36,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 8,
})

/**
 * InputBar component - Bottom input component with send button
 * 
 * Features:
 * - Pill-shaped input field (48-52px height, 24-26px border radius)
 * - Focus state tracking for border style changes
 * - Send button with opacity based on input content
 * - Accessibility labels for screen readers
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.4, 7.5
 */
export default function InputBar({
  value,
  onChangeText,
  onSend,
  placeholder = 'Ask anything…',
}: InputBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasTriggeredLayoutFix = useRef(false)
  const inputRef = useRef<RNTextInput>(null)

  // Check if input has non-whitespace content
  const hasContent = value.trim().length > 0

  // Send button opacity: 0.5 when empty, 1.0 when has content
  const sendButtonOpacity = hasContent ? 1.0 : 0.5

  // Handle focus state
  const handleFocus = () => {
    setIsFocused(true)
    
    // Workaround: Trigger a dummy input interaction on first focus
    if (!hasTriggeredLayoutFix.current) {
      hasTriggeredLayoutFix.current = true
      setTimeout(() => {
        if (value === '') {
          onChangeText(' ')
          setTimeout(() => {
            onChangeText('')
          }, 0)
        }
      }, 50)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  // Handle send action
  const handleSend = () => {
    if (hasContent) {
      onSend()
    }
  }

  return (
    <Container>
      <InputContainer focused={isFocused}>
        <StyledInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A0A0A0"
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          accessibilityLabel="Message input field, Ask anything"
          accessibilityRole="none"
        />
        <SendButton
          onPress={handleSend}
          style={{ opacity: sendButtonOpacity }}
          accessibilityLabel="Send message, button"
          accessibilityRole="button"
          disabled={!hasContent}
        >
          <Feather
            name="send"
            size={20}
            color={hasContent ? '#7A2EFF' : '#A0A0A0'}
          />
        </SendButton>
      </InputContainer>
    </Container>
  )
}
