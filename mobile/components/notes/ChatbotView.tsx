import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ChatHeader from './ChatHeader'
import ChatBody, { ChatBodyRef } from './ChatBody'
import InputBar from './InputBar'
import { ChatMessage } from './MessageBubble'
import { chatWithNote } from '../../lib/api/notes'
import { saveChatHistory, loadChatHistory } from '../../lib/storage/chatStorage'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface ChatbotViewProps {
  noteId: string
}

export default function ChatbotView({ noteId }: ChatbotViewProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatBodyRef = useRef<ChatBodyRef>(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await loadChatHistory(noteId)
        if (history && history.length > 0) setMessages(history)
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
    loadHistory()
  }, [noteId])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const generateMessageId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const handleSend = useCallback(async () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isLoading) return

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      text: trimmedInput,
      isUser: true,
      timestamp: new Date(),
    }

    addMessage(userMessage)
    setInputValue('')

    const updatedMessagesWithUser = [...messages, userMessage]
    try { await saveChatHistory(noteId, updatedMessagesWithUser) } catch (e) {}

    setIsLoading(true)
    try {
      const botResponseText = await chatWithNote(noteId, trimmedInput)
      const botMessage: ChatMessage = {
        id: generateMessageId(),
        text: botResponseText,
        isUser: false,
        timestamp: new Date(),
      }
      addMessage(botMessage)
      try { await saveChatHistory(noteId, [...updatedMessagesWithUser, botMessage]) } catch (e) {}
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      }
      addMessage(errorMessage)
      try { await saveChatHistory(noteId, [...updatedMessagesWithUser, errorMessage]) } catch (e) {}
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, messages, noteId, addMessage, generateMessageId])

  const pageBg = isDark ? neutral[950] : '#fff'

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ChatHeader />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.flex}>
          <ChatBody ref={chatBodyRef} messages={messages} isLoading={isLoading} />
        </View>

        <InputBar
          value={inputValue}
          onChangeText={setInputValue}
          onSend={handleSend}
          placeholder="Ask anything\u2026"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
})
