import React, { useState, useEffect, useRef } from 'react'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  StatusBar,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { notesApi } from '@/lib/api'
import BackButton from '@/components/ui/BackButton'
import { useAlert } from '@/lib/contexts/AlertContext'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'

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

// FlipCard Component
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

export default function FlashcardView({ noteId }: FlashcardViewProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { showAlert } = useAlert()
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
        setError('No flashcard content was received. Please try generating flashcards again.')
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
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>
              {isGenerating ? t('flashcards.generating') : t('common.loading')}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
            <BackButton />
          </View>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={generateFlashcards}>
              <Text style={styles.retryButtonText}>{t('flashcards.generate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
              <Text style={styles.backButtonErrorText}>{t('common.back')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // If no flashcards loaded, show generate flashcards option
  if (!flashcards || flashcards.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="help-circle" size={64} color="#7C3AED" />
            <Text style={styles.errorTitle}>No Flashcards Available</Text>
            <Text style={styles.errorSubtitle}>
              Generate flashcards from this note to help you study
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateFlashcards}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="zap" size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>Generate Flashcards</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButtonError}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonErrorText}>Go Back</Text>
            </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Top Row: Back Button and Delete Button */}
          <View style={styles.headerTopRow}>
            {/* Left: Circular Back Button */}
            <TouchableOpacity
              style={styles.circularBackButton}
              onPress={() => router.back()}
            >
              <Feather name="chevron-left" size={24} color="#374151" />
            </TouchableOpacity>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Right: Delete Button */}
            <View>
              {flashcards.length > 0 ? (
                <TouchableOpacity
                  onPress={handleDeleteFlashcards}
                  style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Feather name="trash-2" size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}
            </View>
          </View>

          {/* Second Row: Card Info */}
          <View style={styles.headerSecondRow}>
            <Text style={styles.cardLabel}>Card {currentCard + 1}</Text>
            <Text style={styles.remainingCount}>{cardsLeft} left</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${((currentCard + 1) / flashcards.length) * 100}%` }
                ]}
              />
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {!isComplete && currentFlashcard && (
            <>
              {/* Card Stack Effect */}
              <View style={styles.cardStackContainer}>
                {/* Background stacked cards */}
                <View style={[styles.stackedCard, styles.stackedCard3]} />
                <View style={[styles.stackedCard, styles.stackedCard2]} />

                {/* Main Flashcard with Flip Animation */}
                <FlipCard
                  isFlipped={isFlipped}
                  cardStyle={styles.flipCardContainer}
                  direction='y'
                  duration={500}
                  RegularContent={
                    <Pressable onPress={handleFlipCard} style={styles.flashcard}>
                      <Text style={styles.flashcardText}>
                        {currentFlashcard.front}
                      </Text>
                      <Text style={styles.helperText}>{t('flashcards.flipCard')}</Text>
                    </Pressable>
                  }
                  FlippedContent={
                    <Pressable onPress={handleFlipCard} style={[styles.flashcard, styles.flashcardBack]}>
                      <Text style={styles.flashcardText}>
                        {currentFlashcard.back}
                      </Text>
                    </Pressable>
                  }
                />
              </View>

              {/* Bottom Feedback Controls */}
              <View style={styles.feedbackCard}>
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackText}>Get it right?</Text>
                  <View style={styles.feedbackButtons}>
                    <TouchableOpacity
                      style={styles.thumbsDownButton}
                      onPress={handleGotItWrong}
                    >
                      <Feather name="thumbs-down" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.thumbsUpButton}
                      onPress={handleGotItRight}
                    >
                      <Feather name="thumbs-up" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Completion Screen - Success */}
          {isSuccess && (
            <ViewShot ref={completionScreenRef} options={{ format: 'png', quality: 1.0 }} style={{ backgroundColor: '#FFFFFF' }}>
              <View style={styles.completionContainer}>
                <View style={[styles.completionCircle, styles.completionCircleSuccess]}>
                  <Text style={styles.emojiIcon}>🏆</Text>
                </View>

                <View style={styles.completionScoreContainer}>
                  <Text style={styles.completionScoreText}>
                    {completionPercentage}%
                  </Text>
                </View>

                <Text style={styles.completionMessage}>{t('flashcards.nicelyDone')}</Text>

                <View style={styles.completionStats}>
                  <Text style={styles.completionStat}>{t('flashcards.percentCorrect', { percent: completionPercentage })}</Text>
                </View>

                <View style={styles.completionActions}>
                  <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Text style={styles.shareButtonText}>{t('flashcards.share')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNew}>
                    <Feather name="plus" size={20} color="#374151" />
                    <Text style={styles.createNewButtonText}>{t('flashcards.createNew')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ViewShot>
          )}

          {/* Completion Screen - Retry */}
          {isRetry && (
            <ViewShot ref={completionScreenRef} options={{ format: 'png', quality: 1.0 }} style={{ backgroundColor: '#FFFFFF' }}>
              <View style={styles.completionContainer}>
                <View style={[styles.completionCircle, styles.completionCircleRetry]}>
                  <Text style={styles.emojiIcon}>😅</Text>
                </View>

                <View style={styles.completionScoreContainer}>
                  <Text style={[styles.completionScoreText, styles.completionScoreRetryText]}>
                    {completionPercentage}%
                  </Text>
                </View>

                <Text style={styles.completionMessage}>{t('flashcards.tryAgain')}</Text>

                <View style={styles.completionStats}>
                  <Text style={styles.completionStat}>{t('flashcards.percentCorrect', { percent: completionPercentage })}</Text>
                </View>

                <View style={styles.completionActionsRetry}>
                  <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                    <Feather name="rotate-cw" size={20} color="#374151" />
                    <Text style={styles.retakeButtonText}>{t('flashcards.retake')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.shareButtonBlack} onPress={handleShare}>
                    <Text style={styles.shareButtonBlackText}>{t('flashcards.share')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNew}>
                    <Feather name="plus" size={20} color="#374151" />
                    <Text style={styles.createNewButtonText}>{t('flashcards.createNew')}</Text>
                  </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  circularBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSecondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  remainingCount: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  headerTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerIcon: {
    marginRight: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    flexGrow: 1,
  },
  cardStackContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
    position: 'relative',
  },
  stackedCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stackedCard2: {
    width: '92%',
    height: 380,
    top: -8,
    zIndex: 1,
  },
  stackedCard3: {
    width: '88%',
    height: 380,
    top: -16,
    zIndex: 0,
  },
  flipCardContainer: {
    width: '100%',
    minHeight: 380,
    backfaceVisibility: 'hidden',
    zIndex: 2,
  },
  flashcard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingVertical: 60,
    paddingHorizontal: 28,
    minHeight: 380,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  flashcardBack: {
    backgroundColor: '#F1FCF5',
  },
  flashcardText: {
    fontSize: 19,
    lineHeight: 34,
    textAlign: 'center',
    color: '#111827',
    fontWeight: '500',
  },
  helperText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '400',
    marginTop: 24,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbsDownButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbsUpButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  completionCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  completionCircleSuccess: {
    backgroundColor: '#D0FAE5',
  },
  completionCircleRetry: {
    backgroundColor: '#FED7AA',
  },
  emojiIcon: {
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 60,
    lineHeight: 60,
    textAlign: 'center',
    color: '#0A0A0A',
    width: 60,
    height: 60,
  },
  completionScoreContainer: {
    width: 87,
    height: 40,
    backgroundColor: '#D0FAE5',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionScoreText: {
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#009966',
  },
  completionScoreRetryText: {
    color: '#F97316',
  },
  completionMessage: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  completionStats: {
    alignItems: 'center',
    marginBottom: 48,
  },
  completionStat: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  completionActions: {
    width: '100%',
    gap: 12,
  },
  completionActionsRetry: {
    width: '100%',
    gap: 12,
    marginTop: 'auto',
    paddingBottom: 20,
  },
  shareButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareButtonBlack: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  shareButtonBlackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  createNewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  homeIndicator: {
    height: 6,
    backgroundColor: '#E6E6F0',
    borderRadius: 999,
    marginTop: 12,
    marginBottom: 6,
    alignSelf: 'center',
    width: 120,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorTitle: {
    marginTop: 24,
    color: '#111827',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  errorSubtitle: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    marginTop: 16,
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  generateButton: {
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonError: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonErrorText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
})
