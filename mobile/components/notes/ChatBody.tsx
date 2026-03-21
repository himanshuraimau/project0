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
  View,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import MessageBubble, { ChatMessage } from './MessageBubble'

interface ChatBodyProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

export interface ChatBodyRef {
  scrollToBottom: (animated?: boolean) => void
}

function TypingShimmer() {
  const { mode } = useTheme()
  const isDark = mode === 'dark'
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    )
    animation.start()
    return () => animation.stop()
  }, [shimmer])

  const bubbleBg = isDark ? neutral[800] : '#f0f0f5'

  return (
    <View style={[shimmerStyles.container, { alignItems: 'flex-start' }]}>
      <View style={[shimmerStyles.bubble, { backgroundColor: bubbleBg }]}>
        {[0, 1, 2].map((i) => {
          const opacity = shimmer.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: i === 0 ? [0.3, 1, 0.3] : i === 1 ? [0.15, 0.7, 0.15] : [0.1, 0.5, 0.1],
          })
          const scale = shimmer.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: i === 0 ? [0.85, 1.1, 0.85] : i === 1 ? [0.9, 1.15, 0.9] : [0.85, 1.1, 0.85],
          })
          return (
            <Animated.View
              key={i}
              style={[
                shimmerStyles.dot,
                {
                  backgroundColor: isDark ? neutral[500] : neutral[400],
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          )
        })}
      </View>
    </View>
  )
}

const shimmerStyles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderTopLeftRadius: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})

const ChatBody = forwardRef<ChatBodyRef, ChatBodyProps>(
  ({ messages, isLoading = false }, ref) => {
    const scrollViewRef = useRef<ScrollView>(null)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const prevMessagesLengthRef = useRef(messages.length)

    useImperativeHandle(ref, () => ({
      scrollToBottom: (animated = true) => {
        scrollViewRef.current?.scrollToEnd({ animated })
      },
    }))

    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
        const isNearBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 50
        setIsAtBottom(isNearBottom)
      },
      []
    )

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

    // Auto-scroll when loading starts
    useEffect(() => {
      if (isLoading && isAtBottom) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }
    }, [isLoading, isAtBottom])

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sortedMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingShimmer />}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
})

export default ChatBody
