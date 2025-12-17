import BackButton from '@/components/ui/BackButton'
import { chatWithNote } from '@/lib/api/notes'
import { loadChatHistory, saveChatHistory } from '@/lib/storage/chatStorage'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Markdown from 'react-native-markdown-display'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ChatbotViewProps {
  noteId: string
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ChatbotView({ noteId }: ChatbotViewProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true)
        const history = await loadChatHistory(noteId)

        console.log('Loading chat history for noteId:', noteId)
        console.log('History loaded:', history ? `${history.length} messages` : 'null')

        if (history && history.length > 0) {
          // Load existing chat history
          console.log('Setting messages from history')
          setMessages(history)
        } else {
          // Initialize with welcome message if no history
          console.log('No history found, setting welcome message')
          setMessages([
            {
              id: '1',
              text: t('chat.welcomeMessage'),
              isUser: false,
              timestamp: new Date(),
            },
          ])
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
        // Fallback to welcome message on error
        setMessages([
          {
            id: '1',
            text: t('chat.welcomeMessage'),
            isUser: false,
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadHistory()
  }, [noteId])

  // Save chat history whenever messages change (but not on initial load)
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0) {
      console.log('Auto-saving chat history, messages count:', messages.length)
      saveChatHistory(noteId, messages).catch((error) => {
        console.error('Error saving chat history:', error)
      })
    }
  }, [messages, noteId, isLoadingHistory])

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd(true)
    }, 100)
  }, [messages])

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsSending(true)

    try {
      // Call the chat API with streaming
      const response = await chatWithNote(noteId, userMessage.text)

      // Create AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
      console.error('Chat error:', error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('chat.errorMessage'),
        isUser: false,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const renderMessage = (message: Message) => {
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Markdown
            style={{
              body: {
                color: message.isUser ? '#FFFFFF' : '#111827',
                fontSize: 15,
                lineHeight: 22,
              },
              paragraph: {
                marginTop: 0,
                marginBottom: 0,
              },
              link: {
                color: message.isUser ? '#FFFFFF' : '#7C3AED',
                textDecorationLine: 'underline',
              },
              code_inline: {
                backgroundColor: message.isUser ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                borderRadius: 4,
                paddingHorizontal: 4,
                paddingVertical: 2,
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              },
              fence: {
                backgroundColor: message.isUser ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                borderColor: 'transparent',
                borderRadius: 8,
                padding: 8,
                marginVertical: 8,
              },
            }}
          >
            {message.text}
          </Markdown>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('chat.title')}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages Area with Keyboard Aware ScrollView */}
        <KeyboardAwareScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          keyboardOpeningTime={0}
        >
          {isLoadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : (
            <>
              {messages.map(renderMessage)}

              {/* Typing indicator */}
              {isSending && (
                <View style={[styles.messageContainer, styles.aiMessageContainer]}>
                  <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </KeyboardAwareScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={t('chat.placeholder')}
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isSending}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <Feather name="send" size={20} color="#7C3AED" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerSpacer: {
    width: 48,
  },
  headerTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    marginRight: 4,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '90%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#eaeaeaff',
    borderTopLeftRadius: 4,
  },
  // Removed messageText, userMessageText, aiMessageText as they are replaced by Markdown styles
  typingBubble: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  homeIndicator: {
    height: 6,
    backgroundColor: '#E6E6F0',
    borderRadius: 999,
    marginTop: 8,
    marginBottom: 6,
    alignSelf: 'center',
    width: 120,
    opacity: 0.7,
  },
})