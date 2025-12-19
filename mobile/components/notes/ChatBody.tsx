import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react'
import {
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import MessageBubble, { ChatMessage } from './MessageBubble'

interface ChatBodyProps {
  messages: ChatMessage[]
}

export interface ChatBodyRef {
  scrollToBottom: (animated?: boolean) => void
}

/**
 * ChatBody component - Scrollable container for messages with smart scroll behavior
 * 
 * Features:
 * - ScrollView container with 16px horizontal padding
 * - Messages rendered with 10-12px vertical gap
 * - Ref forwarding for scroll control
 * - Smart auto-scroll: scrolls to bottom when new message added if user is at bottom
 * - Preserves scroll position when user is scrolled up
 * - Chronological message ordering (oldest first, newest last)
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
const ChatBody = forwardRef<ChatBodyRef, ChatBodyProps>(
  ({ messages }, ref) => {
    const scrollViewRef = useRef<ScrollView>(null)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const prevMessagesLengthRef = useRef(messages.length)

    // Expose scrollToBottom method via ref
    useImperativeHandle(ref, () => ({
      scrollToBottom: (animated = true) => {
        scrollViewRef.current?.scrollToEnd({ animated })
      },
    }))

    // Sort messages by timestamp in ascending order (oldest first, newest last)
    // Requirements: 3.1
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Track scroll position to detect if user is at bottom (within 50px threshold)
    // Requirements: 3.3, 3.4
    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
        const paddingToBottom = 50 // 50px threshold
        const isNearBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
        setIsAtBottom(isNearBottom)
      },
      []
    )

    // Auto-scroll to bottom when new message is added (if user was at bottom)
    // Requirements: 3.3, 3.4
    useEffect(() => {
      const currentLength = messages.length
      const prevLength = prevMessagesLengthRef.current

      // Only auto-scroll if a new message was added and user was at bottom
      if (currentLength > prevLength && isAtBottom) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }

      prevMessagesLengthRef.current = currentLength
    }, [messages.length, isAtBottom])

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {sortedMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>
    )
  }
)

ChatBody.displayName = 'ChatBody'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16, // 16px horizontal padding (Requirements 3.1)
    paddingVertical: 8,
  },
})

export default ChatBody
