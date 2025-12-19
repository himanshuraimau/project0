import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Feather } from '@expo/vector-icons'

interface InputBarProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  placeholder?: string
}

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

  // Check if input has non-whitespace content (Requirements 4.4, 4.5, 4.6, 4.7)
  const hasContent = value.trim().length > 0

  // Send button opacity: 0.5 when empty, 1.0 when has content (Requirements 4.4, 4.5)
  const sendButtonOpacity = hasContent ? 1.0 : 0.5

  // Handle focus state (Requirements 4.2, 4.3)
  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  // Handle send action (Requirements 4.6, 4.7)
  const handleSend = () => {
    if (hasContent) {
      onSend()
    }
    // Do nothing when input is empty or whitespace-only (Requirement 4.7)
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.inputContainerFocused : styles.inputContainerUnfocused,
        ]}
      >
        <TextInput
          style={styles.input}
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
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, { opacity: sendButtonOpacity }]}
          accessibilityLabel="Send message, button"
          accessibilityRole="button"
          disabled={!hasContent}
        >
          <Feather
            name="send"
            size={20}
            color={hasContent ? '#7A2EFF' : '#A0A0A0'}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50, // 48-52px range, using 50px as middle value
    borderRadius: 25, // 24-26px range, using 25px as middle value (pill-shaped)
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  // Unfocused border state (Requirement 4.2)
  inputContainerUnfocused: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  // Focused border state (Requirement 4.3)
  inputContainerFocused: {
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0, // Remove default padding
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
})
