import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react'
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { ScrollView, YStack } from 'tamagui'
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
    const scrollViewRef = useRef<any>(null)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const prevMessagesLengthRef = useRef(messages.length)

    // Expose scrollToBottom method via ref
    useImperativeHandle(ref, () => ({
      scrollToBottom: (animated = true) => {
        scrollViewRef.current?.scrollToEnd({ animated })
      },
    }))

    // Sort messages by timestamp in ascending order (oldest first, newest last)
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Track scroll position to detect if user is at bottom (within 50px threshold)
    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
        const paddingToBottom = 50
        const isNearBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
        setIsAtBottom(isNearBottom)
      },
      []
    )

    // Auto-scroll to bottom when new message is added (if user was at bottom)
    useEffect(() => {
      const currentLength = messages.length
      const prevLength = prevMessagesLengthRef.current

      if (currentLength > prevLength && isAtBottom) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }

      prevMessagesLengthRef.current = currentLength
    }, [messages.length, isAtBottom])

    return (
      <ScrollView
        ref={scrollViewRef}
        flex={1}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <YStack paddingHorizontal="$4" paddingVertical={8}>
          {sortedMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </YStack>
      </ScrollView>
    )
  }
)

ChatBody.displayName = 'ChatBody'

export default ChatBody
