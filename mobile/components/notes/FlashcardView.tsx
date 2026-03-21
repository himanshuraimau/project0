import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  StatusBar,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { notesApi } from '@/lib/api'
import { useAlert } from '@/lib/contexts/AlertContext'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.88
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.45, 380)

interface FlashcardViewProps {
  noteId: string
}

type FlashcardState = 'loading' | 'front' | 'back' | 'success' | 'retry'

interface FlashcardItem {
  id: number
  front: string
  back: string
}

interface FlashcardData {
  flashcards: FlashcardItem[]
}

// FlipCard Component with stacked deck effect
const FlipCard = ({
  isFlipped,
  cardStyle,
  direction = 'x',
  duration = 300,
  RegularContent,
  FlippedContent,
}: {
  isFlipped: any
  cardStyle: any
  direction?: 'x' | 'y'
  duration?: number
  RegularContent: React.ReactNode
  FlippedContent: React.ReactNode
}) => {
  const isDirectionX = direction === 'x'

  const regularCardAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.value), [0, 1], [0, 180])
    const rotateValue = withTiming(`${spinValue}deg`, { duration })

    return {
      transform: [
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
      ],
      zIndex: isFlipped.value ? 1 : 2,
    }
  })

  const flippedCardAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.value), [0, 1], [180, 360])
    const rotateValue = withTiming(`${spinValue}deg`, { duration })

    return {
      transform: [
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
      ],
      zIndex: isFlipped.value ? 2 : 1,
    }
  })

  return (
    <View>
      <Animated.View
        style={[
          flipCardStyles.regularCard,
          cardStyle,
          regularCardAnimatedStyle,
        ]}>
        {RegularContent}
      </Animated.View>
      <Animated.View
        style={[
          flipCardStyles.flippedCard,
          cardStyle,
          flippedCardAnimatedStyle,
        ]}>
        {FlippedContent}
      </Animated.View>
    </View>
  )
}

const flipCardStyles = StyleSheet.create({
  regularCard: {
    position: 'absolute',
  },
  flippedCard: {
  },
})

// Stacked Card Component for background cards
const StackedCard = ({ index, cardBg, shadowColor }: { index: number; cardBg: string; shadowColor: string }) => {
  const offset = (index + 1) * 8
  const scale = 1 - (index + 1) * 0.04
  const opacity = 1 - (index + 1) * 0.15

  return (
    <View
      style={{
        position: 'absolute',
        backgroundColor: cardBg,
        borderRadius: 24,
        shadowColor: shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        width: CARD_WIDTH * scale,
        height: CARD_HEIGHT,
        top: -offset,
        opacity: Math.max(opacity, 0.5),
        zIndex: -index - 1,
        alignSelf: 'center',
      }}
    />
  )
}

export default function FlashcardView({ noteId }: FlashcardViewProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const pageBg = isDark ? neutral[950] : '#f0f0f0'
  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'

  const [flashcardState, setFlashcardState] = useState<FlashcardState>('loading')
  const [currentCard, setCurrentCard] = useState(0)
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([])
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [startTime] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Flip animation using react-native-reanimated
  const isFlipped = useSharedValue(false)

  // Ref for screenshot capture
  const completionScreenRef = useRef<ViewShot>(null)

  // Fetch flashcards data on mount
  useEffect(() => {
    if (noteId) {
      fetchFlashcards()
    }
  }, [noteId])

  const fetchFlashcards = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await notesApi.getFlashcards(noteId)

      console.log('Flashcard response:', response)
      console.log('Flashcard content:', response?.content)
      console.log('Content type:', typeof response?.content)

      if (response && response.content) {
        const content = typeof response.content === 'string'
          ? JSON.parse(response.content)
          : response.content

        console.log('Parsed flashcard content:', content)
        console.log('Is array?', Array.isArray(content))

        let flashcardsArray: any[] = []

        // Handle multiple possible formats
        if (Array.isArray(content)) {
          // Format 1: Direct array [{ id, question, answer }, ...]
          console.log('Format: Direct array')
          flashcardsArray = content
        } else if (content.flashcards && Array.isArray(content.flashcards)) {
          // Format 2: Object with flashcards key { flashcards: [...] }
          console.log('Format: Object with flashcards key')
          flashcardsArray = content.flashcards
        } else {
          console.error('Unknown format:', content)
          setError('Invalid flashcard format')
          setLoading(false)
          return
        }

        // Map question/answer to front/back if needed
        const normalizedFlashcards = flashcardsArray.map((card: any) => ({
          id: card.id,
          front: card.front || card.question || '',
          back: card.back || card.answer || ''
        }))

        console.log('Normalized flashcards:', normalizedFlashcards.length, 'cards')
        console.log('First card:', normalizedFlashcards[0])

        if (normalizedFlashcards.length > 0) {
          setFlashcards(normalizedFlashcards)
          setFlashcardState('front')
          setLoading(false)  // Turn off loading after successful set
        } else {
          console.warn('Empty flashcards array received')
          setError('No flashcards could be generated from this note. The content might not be suitable for flashcard creation.')
          setFlashcards([])
          setLoading(false)
        }
      } else {
        console.warn('No content in flashcard response')
        setFlashcards([])
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Failed to fetch flashcards:', err)
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        console.log('Flashcards not found')
        setFlashcards([])
        setLoading(false)
      } else {
        setError(err.message || 'Failed to load flashcards')
        setLoading(false)
      }
    }
  }

  const generateFlashcards = async () => {
    try {
      setLoading(true)
      setIsGenerating(true)
      setError(null)
      const response = await notesApi.generateFlashcards({ noteId })

      console.log('Generated flashcard response:', response)
      console.log('Generated content:', response?.content)

      if (response && response.content) {
        const content = typeof response.content === 'string'
          ? JSON.parse(response.content)
          : response.content

        console.log('Parsed generated content:', content)

        let flashcardsArray: any[] = []

        // Handle multiple possible formats
        if (Array.isArray(content)) {
          // Format 1: Direct array [{ id, question, answer }, ...]
          console.log('Generated format: Direct array')
          flashcardsArray = content
        } else if (content.flashcards && Array.isArray(content.flashcards)) {
          // Format 2: Object with flashcards key { flashcards: [...] }
          console.log('Generated format: Object with flashcards key')
          flashcardsArray = content.flashcards
        } else {
          console.error('Unknown generated format:', content)
          setError('Invalid flashcard format from generation')
          setLoading(false)
          setIsGenerating(false)
          return
        }

        // Map question/answer to front/back if needed
        const normalizedFlashcards = flashcardsArray.map((card: any) => ({
          id: card.id,
          front: card.front || card.question || '',
          back: card.back || card.answer || ''
        }))

        console.log('Generated normalized flashcards:', normalizedFlashcards.length, 'cards')

        if (normalizedFlashcards.length > 0) {
          setFlashcards(normalizedFlashcards)
          setFlashcardState('front')
        } else {
          setError('Generated empty flashcard set')
        }
      } else {
        setError('No content in generated response')
      }
    } catch (err: any) {
      console.error('Failed to generate flashcards:', err)
      setError(err.message || 'Failed to generate flashcards')
    } finally {
      setLoading(false)
      setIsGenerating(false)
    }
  }

  const handleDeleteFlashcards = async () => {
    if (isDeleting) return

    // Confirm deletion with native alert
    showAlert(
      t('flashcards.deleteTitle'),
      t('flashcards.deleteConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true)
            try {
              await notesApi.deleteFlashcards(noteId)
              // Reset state to show empty state with generate button
              setFlashcards([])
              setCurrentCard(0)
              setCorrectAnswers(0)
              setWrongAnswers(0)
              setFlashcardState('front')
              setLoading(false)
              setError(null)
            } catch (err: any) {
              console.error('Failed to delete flashcards:', err)
              setError(err.message || t('flashcards.deleteFailed'))
            } finally {
              setIsDeleting(false)
            }
          },
        },
      ]
    )
  }

  const handleFlipCard = () => {
    if (flashcardState === 'front') {
      isFlipped.value = true
      setFlashcardState('back')
    } else if (flashcardState === 'back') {
      isFlipped.value = false
      setFlashcardState('front')
    }
  }

  const handleGotItWrong = () => {
    setWrongAnswers(prev => prev + 1)
    moveToNextCard()
  }

  const handleGotItRight = () => {
    setCorrectAnswers(prev => prev + 1)
    moveToNextCard()
  }

  const moveToNextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(prev => prev + 1)
      setFlashcardState('front')
      // Reset flip animation
      isFlipped.value = false
    } else {
      // Quiz complete - check score
      const totalAnswered = correctAnswers + wrongAnswers + 1
      const finalCorrect = flashcardState === 'back' ? correctAnswers : correctAnswers + 1
      const percentage = Math.round((finalCorrect / totalAnswered) * 100)

      if (percentage >= 70) {
        setFlashcardState('success')
      } else {
        setFlashcardState('retry')
      }
    }
  }

  const moveToPreviousCard = () => {
    if (currentCard > 0) {
      setCurrentCard(prev => prev - 1)
      setFlashcardState('front')
      // Reset flip animation
      isFlipped.value = false
    }
  }

  const handleRetake = () => {
    setCurrentCard(0)
    setCorrectAnswers(0)
    setWrongAnswers(0)
    setFlashcardState('front')
    // Reset flip animation
    isFlipped.value = false
  }

  const handleShare = async () => {
    try {
      if (!completionScreenRef.current || !completionScreenRef.current.capture) {
        console.error('Completion screen ref not available')
        return
      }

      // Capture screenshot
      const uri = await completionScreenRef.current.capture()

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        showAlert(
          'Sharing not available',
          'Sharing is not available on this device',
          [{ text: 'OK', style: 'default' }]
        )
        return
      }

      // Share the screenshot
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your flashcard results',
      })
    } catch (error) {
      console.error('Error sharing screenshot:', error)
      showAlert(
        'Share failed',
        'Failed to share screenshot. Please try again.',
        [{ text: 'OK', style: 'default' }]
      )
    }
  }

  const handleCreateNew = () => {
    // Generate new flashcards
    generateFlashcards()
  }

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const getCompletionPercentage = () => {
    const total = correctAnswers + wrongAnswers
    if (total === 0) return 0
    return Math.round((correctAnswers / total) * 100)
  }

  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={s.safe}>
          <View style={s.stateWrap}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[s.stateText, { color: c.mutedForeground }]}>
              {isGenerating ? t('flashcards.generating') : t('common.loading')}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[s.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}><Feather name="arrow-left" size={24} color={c.foreground} /></Pressable>
            <Text style={[s.headerTitle, { color: c.foreground }]}>Flashcards</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={s.stateWrap}>
            <Feather name="alert-circle" size={44} color={c.destructive} />
            <Text style={[s.stateTitle, { color: c.foreground }]}>Something went wrong</Text>
            <Text style={[s.stateText, { color: c.mutedForeground }]}>{error}</Text>
            <Pressable
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: c.primary, opacity: pressed ? 0.7 : 1 }]}
              onPress={generateFlashcards}
            >
              <Text style={[s.primaryBtnText, { color: c.primaryForeground }]}>Retry</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // If no flashcards loaded, show generate flashcards option
  if (!flashcards || flashcards.length === 0) {
    return (
      <View style={[s.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}><Feather name="arrow-left" size={24} color={c.foreground} /></Pressable>
            <Text style={[s.headerTitle, { color: c.foreground }]}>Flashcards</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={s.stateWrap}>
            <View style={[s.emptyIcon, { backgroundColor: isDark ? 'rgba(79,59,231,0.1)' : 'rgba(79,59,231,0.06)' }]}>
              <Ionicons name="flash" size={36} color={c.primary} />
            </View>
            <Text style={[s.stateTitle, { color: c.foreground }]}>No Flashcards Available</Text>
            <Text style={[s.stateText, { color: c.mutedForeground }]}>
              Generate flashcards from this note to help you study
            </Text>
            <Pressable
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: c.primary, opacity: pressed ? 0.7 : 1 }]}
              onPress={generateFlashcards}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={c.primaryForeground} />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color={c.primaryForeground} />
                  <Text style={[s.primaryBtnText, { color: c.primaryForeground }]}>Generate Flashcards</Text>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  const currentFlashcard = flashcards[currentCard]
  const cardsLeft = flashcards.length - currentCard - 1
  const isSuccess = flashcardState === 'success'
  const isRetry = flashcardState === 'retry'
  const isComplete = isSuccess || isRetry
  const completionPercentage = getCompletionPercentage()
  const progress = (currentCard + 1) / flashcards.length
  const scoreColor = completionPercentage >= 70 ? '#34C759' : completionPercentage >= 40 ? '#FF9500' : '#FF3B30'

  return (
    <View style={[s.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={s.safe}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={c.foreground} />
          </Pressable>
          <Text style={[s.headerTitle, { color: c.foreground }]}>
            Card {currentCard + 1} of {flashcards.length}
          </Text>
          {flashcards.length > 0 ? (
            <Pressable
              onPress={handleDeleteFlashcards}
              hitSlop={12}
              disabled={isDeleting}
              style={({ pressed }) => ({ opacity: isDeleting ? 0.5 : pressed ? 0.7 : 1 })}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Feather name="trash-2" size={20} color="#FF3B30" />
              )}
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        {/* Progress bar */}
        <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={[s.progressFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {!isComplete && currentFlashcard && (
            <>
              {/* Card Stack Effect */}
              <View style={s.cardStackContainer}>
                {/* Background stacked cards for deck illusion */}
                {cardsLeft >= 2 && <StackedCard index={1} cardBg={cardBg} shadowColor={c.foreground} />}
                {cardsLeft >= 1 && <StackedCard index={0} cardBg={cardBg} shadowColor={c.foreground} />}

                {/* Main Flashcard with Flip Animation */}
                <FlipCard
                  isFlipped={isFlipped}
                  cardStyle={s.flipCardContainer}
                  direction='y'
                  duration={500}
                  RegularContent={
                    <Pressable onPress={handleFlipCard} style={[s.flashcard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <Text style={[s.flashcardText, { color: c.foreground }]}>
                        {currentFlashcard.front}
                      </Text>
                      <Text style={[s.helperText, { color: c.mutedForeground }]}>{t('flashcards.flipCard')}</Text>
                    </Pressable>
                  }
                  FlippedContent={
                    <Pressable onPress={handleFlipCard} style={[s.flashcard, { backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#F1FCF5', borderColor: cardBorder }]}>
                      <Text style={[s.flashcardText, { color: c.foreground }]}>
                        {currentFlashcard.back}
                      </Text>
                    </Pressable>
                  }
                />
              </View>

              {/* Bottom Feedback Controls */}
              <View style={s.feedbackRow}>
                {/* Back chevron */}
                <Pressable
                  style={({ pressed }) => [s.navCircle, { backgroundColor: isDark ? neutral[800] : neutral[100], opacity: currentCard === 0 ? 0.5 : pressed ? 0.7 : 1 }]}
                  onPress={moveToPreviousCard}
                  disabled={currentCard === 0}
                >
                  <Feather name="chevron-left" size={20} color={currentCard === 0 ? c.mutedForeground : c.foreground} />
                </Pressable>

                {/* Got it wrong */}
                <Pressable
                  style={({ pressed }) => [s.wrongBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', opacity: pressed ? 0.7 : 1 }]}
                  onPress={handleGotItWrong}
                >
                  <Feather name="x" size={18} color={c.destructive} />
                  <Text style={[s.wrongBtnText, { color: c.destructive }]}>Wrong</Text>
                </Pressable>

                {/* Got it right */}
                <Pressable
                  style={({ pressed }) => [s.rightBtn, { backgroundColor: '#34C759', opacity: pressed ? 0.7 : 1 }]}
                  onPress={handleGotItRight}
                >
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={s.rightBtnText}>Right</Text>
                </Pressable>

                {/* Next chevron */}
                <Pressable
                  style={({ pressed }) => [s.navCircle, { backgroundColor: isDark ? neutral[800] : neutral[100], opacity: currentCard >= flashcards.length - 1 ? 0.5 : pressed ? 0.7 : 1 }]}
                  onPress={moveToNextCard}
                  disabled={currentCard >= flashcards.length - 1}
                >
                  <Feather name="chevron-right" size={20} color={currentCard >= flashcards.length - 1 ? c.mutedForeground : c.foreground} />
                </Pressable>
              </View>
            </>
          )}

          {/* Completion Screen - Success */}
          {isSuccess && (
            <ViewShot ref={completionScreenRef} options={{ format: 'png', quality: 1.0 }} style={{ backgroundColor: pageBg }}>
              <View style={s.completeContent}>
                <View style={[s.scoreCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[s.scoreNum, { color: scoreColor }]}>{completionPercentage}%</Text>
                  <Text style={[s.scoreMsg, { color: c.mutedForeground }]}>
                    {completionPercentage >= 80 ? 'Excellent work!' : completionPercentage >= 60 ? 'Good progress!' : 'Keep practicing!'}
                  </Text>
                </View>

                <View style={s.statsRow}>
                  <View style={[s.statCard, { backgroundColor: isDark ? 'rgba(52,199,89,0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.12)' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={[s.statValue, { color: '#34C759' }]}>{correctAnswers}</Text>
                    <Text style={[s.statLabel, { color: c.mutedForeground }]}>Correct</Text>
                  </View>
                  <View style={[s.statCard, { backgroundColor: isDark ? 'rgba(255,59,48,0.1)' : '#FEF2F2', borderColor: isDark ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.12)' }]}>
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    <Text style={[s.statValue, { color: '#FF3B30' }]}>{wrongAnswers}</Text>
                    <Text style={[s.statLabel, { color: c.mutedForeground }]}>Wrong</Text>
                  </View>
                  <View style={[s.statCard, { backgroundColor: isDark ? 'rgba(0,122,255,0.1)' : '#EFF6FF', borderColor: isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.12)' }]}>
                    <Ionicons name="time" size={20} color="#007AFF" />
                    <Text style={[s.statValue, { color: '#007AFF' }]}>{getElapsedTime()}</Text>
                    <Text style={[s.statLabel, { color: c.mutedForeground }]}>Time</Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [s.primaryBtn, { backgroundColor: c.primary, opacity: pressed ? 0.7 : 1, width: '100%' }]}
                  onPress={handleShare}
                >
                  <Feather name="share-2" size={18} color={c.primaryForeground} />
                  <Text style={[s.primaryBtnText, { color: c.primaryForeground }]}>{t('flashcards.share')}</Text>
                </Pressable>

                <View style={s.secondaryRow}>
                  <Pressable
                    style={({ pressed }) => [s.secondaryBtn, { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }]}
                    onPress={handleRetake}
                  >
                    <Ionicons name="refresh" size={16} color={c.foreground} />
                    <Text style={[s.secondaryBtnText, { color: c.foreground }]}>Try Again</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.secondaryBtn, { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }]}
                    onPress={handleCreateNew}
                  >
                    <Feather name="plus" size={16} color={c.foreground} />
                    <Text style={[s.secondaryBtnText, { color: c.foreground }]}>{t('flashcards.createNew')}</Text>
                  </Pressable>
                </View>
              </View>
            </ViewShot>
          )}

          {/* Completion Screen - Retry */}
          {isRetry && (
            <ViewShot ref={completionScreenRef} options={{ format: 'png', quality: 1.0 }} style={{ backgroundColor: pageBg }}>
              <View style={s.completeContent}>
                <View style={[s.scoreCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[s.scoreNum, { color: scoreColor }]}>{completionPercentage}%</Text>
                  <Text style={[s.scoreMsg, { color: c.mutedForeground }]}>Keep practicing!</Text>
                </View>

                <View style={s.statsRow}>
                  <View style={[s.statCard, { backgroundColor: isDark ? 'rgba(52,199,89,0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.12)' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={[s.statValue, { color: '#34C759' }]}>{correctAnswers}</Text>
                    <Text style={[s.statLabel, { color: c.mutedForeground }]}>Correct</Text>
                  </View>
                  <View style={[s.statCard, { backgroundColor: isDark ? 'rgba(255,59,48,0.1)' : '#FEF2F2', borderColor: isDark ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.12)' }]}>
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    <Text style={[s.statValue, { color: '#FF3B30' }]}>{wrongAnswers}</Text>
                    <Text style={[s.statLabel, { color: c.mutedForeground }]}>Wrong</Text>
                  </View>
                  <View style={[s.statCard, { backgroundColor: isDark ? 'rgba(0,122,255,0.1)' : '#EFF6FF', borderColor: isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.12)' }]}>
                    <Ionicons name="time" size={20} color="#007AFF" />
                    <Text style={[s.statValue, { color: '#007AFF' }]}>{getElapsedTime()}</Text>
                    <Text style={[s.statLabel, { color: c.mutedForeground }]}>Time</Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [s.primaryBtn, { backgroundColor: c.primary, opacity: pressed ? 0.7 : 1, width: '100%' }]}
                  onPress={handleRetake}
                >
                  <Ionicons name="refresh" size={18} color={c.primaryForeground} />
                  <Text style={[s.primaryBtnText, { color: c.primaryForeground }]}>{t('flashcards.retake')}</Text>
                </Pressable>

                <View style={s.secondaryRow}>
                  <Pressable
                    style={({ pressed }) => [s.secondaryBtn, { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }]}
                    onPress={handleShare}
                  >
                    <Feather name="share-2" size={16} color={c.foreground} />
                    <Text style={[s.secondaryBtnText, { color: c.foreground }]}>{t('flashcards.share')}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.secondaryBtn, { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }]}
                    onPress={handleCreateNew}
                  >
                    <Feather name="plus" size={16} color={c.foreground} />
                    <Text style={[s.secondaryBtnText, { color: c.foreground }]}>{t('flashcards.createNew')}</Text>
                  </Pressable>
                </View>
              </View>
            </ViewShot>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  progressTrack: { height: 3, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  cardStackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 30,
    position: 'relative',
    minHeight: CARD_HEIGHT + 20,
  },
  flipCardContainer: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    backfaceVisibility: 'hidden',
    zIndex: 10,
  },
  flashcard: {
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
  },
  flashcardText: {
    fontSize: 18,
    lineHeight: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  helperText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 24,
  },

  // Feedback controls
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  navCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrongBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
  },
  wrongBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
  },
  rightBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Completion
  completeContent: { alignItems: 'center', paddingHorizontal: 0, paddingTop: 32, paddingBottom: 40 },
  scoreCard: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', width: '100%', marginBottom: 20 },
  scoreNum: { fontSize: 56, fontWeight: '700', letterSpacing: -2 },
  scoreMsg: { fontSize: 16, fontWeight: '500', marginTop: 8 },

  statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 24 },
  statCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500' },

  secondaryRow: { gap: 10, width: '100%', marginTop: 10 },
  secondaryBtn: { height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },

  // Shared states
  stateWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  stateTitle: { marginTop: 16, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  stateText: { marginTop: 8, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyIcon: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 16, marginTop: 24, paddingHorizontal: 28 },
  primaryBtnText: { fontSize: 17, fontWeight: '600' },
})
