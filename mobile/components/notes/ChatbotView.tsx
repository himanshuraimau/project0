import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ChatHeader from './ChatHeader'
import ChatBody, { ChatBodyRef } from './ChatBody'
import InputBar from './InputBar'
import { ChatMessage } from './MessageBubble'
import { chatWithNote } from '../../lib/api/notes'
import {
  saveChatHistory,
  loadChatHistory,
} from '../../lib/storage/chatStorage'

interface ChatbotViewProps {
  noteId: string
}

/**
 * ChatbotView - Main component for the chat interface
 *
 * Features:
 * - Keyboard-aware layout with KeyboardAvoidingView (behavior="padding")
 * - ChatHeader positioned outside keyboard-aware container (remains fixed)
 * - ChatBody and InputBar inside keyboard-aware container
 * - Message state management with optimistic updates
 * - Chat history persistence using AsyncStorage
 * - API integration with chatWithNote
 *
 * Requirements: 1.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3
 */
export default function ChatbotView({ noteId }: ChatbotViewProps) {
  // Message state array (Requirements 6.1, 6.2, 6.3)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // Input state for the InputBar
  const [inputValue, setInputValue] = useState('')
  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false)
  // Ref for ChatBody scroll control
  const chatBodyRef = useRef<ChatBodyRef>(null)

  // Load chat history from AsyncStorage on mount (Requirements 6.1, 6.2)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await loadChatHistory(noteId)
        if (history && history.length > 0) {
          setMessages(history)
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
        // Graceful degradation - continue without history
      }
    }
    loadHistory()
  }, [noteId])

  /**
   * Add a message to the messages array (optimistic update)
   * Requirements: 6.3
   */
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  /**
   * Generate a unique ID for messages
   */
  const generateMessageId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  /**
   * Handle sending a message
   * - Display user message immediately (optimistic update)
   * - Call chatWithNote API
   * - Add bot response on success
   * - Handle errors gracefully
   * Requirements: 4.6, 6.1, 6.2, 6.3
   */
  const handleSend = useCallback(async () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isLoading) return

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      text: trimmedInput,
      isUser: true,
      timestamp: new Date(),
    }

    // Optimistic update - display user message immediately (Requirements 6.3)
    addMessage(userMessage)

    // Clear input immediately
    setInputValue('')

    // Save messages with user message to storage (Requirements 6.1)
    const updatedMessagesWithUser = [...messages, userMessage]
    try {
      await saveChatHistory(noteId, updatedMessagesWithUser)
    } catch (error) {
      console.error('Failed to save user message:', error)
      // Continue even if save fails (graceful degradation)
    }

    // Call API for bot response
    setIsLoading(true)
    try {
      const botResponseText = await chatWithNote(noteId, trimmedInput)

      // Create bot message
      const botMessage: ChatMessage = {
        id: generateMessageId(),
        text: botResponseText,
        isUser: false,
        timestamp: new Date(),
      }

      // Add bot response to messages
      addMessage(botMessage)

      // Save messages with bot response to storage (Requirements 6.1)
      const updatedMessagesWithBot = [...updatedMessagesWithUser, botMessage]
      try {
        await saveChatHistory(noteId, updatedMessagesWithBot)
      } catch (error) {
        console.error('Failed to save bot message:', error)
        // Continue even if save fails (graceful degradation)
      }
    } catch (error) {
      // Handle API errors gracefully - show error as bot message
      console.error('Chat API error:', error)
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      }
      addMessage(errorMessage)

      // Save error message to storage
      const updatedMessagesWithError = [...updatedMessagesWithUser, errorMessage]
      try {
        await saveChatHistory(noteId, updatedMessagesWithError)
      } catch (saveError) {
        console.error('Failed to save error message:', saveError)
      }
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, messages, noteId, addMessage, generateMessageId])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ChatHeader positioned outside KeyboardAvoidingView (Requirements 1.4) */}
      <ChatHeader />

      {/* KeyboardAvoidingView with behavior="padding" (Requirements 5.1, 5.2, 5.3, 5.4) */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <>
            {/* ChatBody - scrollable message list */}
            <ChatBody ref={chatBodyRef} messages={messages} />

            {/* InputBar - fixed at bottom, moves with keyboard */}
            <InputBar
              value={inputValue}
              onChangeText={setInputValue}
              onSend={handleSend}
              placeholder="Ask anything…"
            />
          </>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
})
