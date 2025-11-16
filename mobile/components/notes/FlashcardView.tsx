import React, { useState, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import {
  StatusBar,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { notesApi } from '@/lib/api'
import { setClerkTokenGetter } from '@/lib/api/client'

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

export default function FlashcardView({ noteId }: FlashcardViewProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const [flashcardState, setFlashcardState] = useState<FlashcardState>('loading')
  const [currentCard, setCurrentCard] = useState(0)
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([])
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [startTime] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set up Clerk token getter on mount
  useEffect(() => {
    setClerkTokenGetter(getToken)
  }, [getToken])

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
          setTimeout(() => generateFlashcards(), 500)
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
          console.error('Empty flashcards array')
          setError('No flashcards found')
          setLoading(false)
          setTimeout(() => generateFlashcards(), 500)
        }
      } else {
        console.error('No content in response')
        setError('No flashcard data available')
        setLoading(false)
        setTimeout(() => generateFlashcards(), 500)
      }
    } catch (err: any) {
      console.error('Failed to fetch flashcards:', err)
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        console.log('Flashcards not found, generating...')
        generateFlashcards()
      } else {
        setError(err.message || 'Failed to load flashcards')
        setLoading(false)
      }
    }
  }

  const generateFlashcards = async () => {
    try {
      setLoading(true)
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
    }
  }

  const handleFlipCard = () => {
    if (flashcardState === 'front') {
      setFlashcardState('back')
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
    }
  }

  const handleRetake = () => {
    setCurrentCard(0)
    setCorrectAnswers(0)
    setWrongAnswers(0)
    setFlashcardState('front')
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share flashcard results')
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
            <Text style={styles.loadingText}>Loading flashcards...</Text>
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={generateFlashcards}>
              <Text style={styles.retryButtonText}>Generate Flashcards</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
              <Text style={styles.backButtonErrorText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // Safety check: ensure flashcards exist and current card is valid
  if (!flashcards || flashcards.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>No flashcards available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={generateFlashcards}>
              <Text style={styles.retryButtonText}>Generate Flashcards</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTime}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
          <View style={styles.headerRight}>
            <Feather name="wifi" size={16} color="#000" style={styles.headerIcon} />
            <Feather name="battery" size={16} color="#000" />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {!isComplete && currentFlashcard && (
            <>
              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                <View style={styles.paginationDots}>
                  {Array.from({ length: Math.min(5, flashcards.length) }).map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === Math.min(currentCard, 4) && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.cardCounter}>
                  {currentCard + 1}/{flashcards.length}
                </Text>
              </View>

              {/* Card Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardInfoText}>Card {currentCard + 1}</Text>
                <Text style={styles.cardsLeft}>{cardsLeft} left</Text>
              </View>

              {/* Flashcard */}
              <TouchableOpacity
                style={[
                  styles.flashcard,
                  flashcardState === 'back' && styles.flashcardBack,
                ]}
                onPress={handleFlipCard}
                activeOpacity={flashcardState === 'front' ? 0.7 : 1}
                disabled={flashcardState === 'back'}
              >
                <Text style={styles.flashcardText}>
                  {flashcardState === 'front' ? currentFlashcard.front : currentFlashcard.back}
                </Text>
              </TouchableOpacity>

              {/* Helper Text / Action Buttons */}
              {flashcardState === 'front' ? (
                <Text style={styles.helperText}>Flip the card to see the answer</Text>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.navigationButton}
                    onPress={moveToPreviousCard}
                    disabled={currentCard === 0}
                  >
                    <Feather name="arrow-left" size={24} color={currentCard === 0 ? '#D1D5DB' : '#374151'} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.wrongButton} onPress={handleGotItWrong}>
                    <Text style={styles.wrongButtonText}>Got it wrong</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.correctButton} onPress={handleGotItRight}>
                    <Text style={styles.correctButtonText}>Got it right</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.navigationButton}
                    onPress={moveToNextCard}
                  >
                    <Feather name="arrow-right" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Completion Screen - Success */}
          {isSuccess && (
            <View style={styles.completionContainer}>
              <View style={[styles.completionCircle, styles.completionCircleSuccess]}>
                <Feather name="award" size={64} color="#F59E0B" />
              </View>

              <Text style={[styles.completionScore, styles.completionScoreSuccess]}>
                {completionPercentage}%
              </Text>

              <Text style={styles.completionMessage}>Nicely done!</Text>

              <View style={styles.completionStats}>
                <Text style={styles.completionStat}>{completionPercentage}% correct</Text>
                <Text style={styles.completionStat}>completed in {getElapsedTime()}</Text>
              </View>

              <View style={styles.completionActions}>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNew}>
                  <Feather name="plus" size={20} color="#374151" />
                  <Text style={styles.createNewButtonText}>Create new flashcards</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Completion Screen - Retry */}
          {isRetry && (
            <View style={styles.completionContainer}>
              <View style={[styles.completionCircle, styles.completionCircleRetry]}>
                <Text style={styles.emojiIcon}>😅</Text>
              </View>

              <Text style={[styles.completionScore, styles.completionScoreRetry]}>
                {completionPercentage}%
              </Text>

              <Text style={styles.completionMessage}>Let's try that again.</Text>

              <View style={styles.completionStats}>
                <Text style={styles.completionStat}>{completionPercentage}% correct</Text>
                <Text style={styles.completionStat}>completed in {getElapsedTime()}</Text>
              </View>

              <View style={styles.completionActionsRetry}>
                <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                  <Feather name="rotate-cw" size={20} color="#374151" />
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButtonBlack} onPress={handleShare}>
                  <Text style={styles.shareButtonBlackText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNew}>
                  <Feather name="plus" size={20} color="#374151" />
                  <Text style={styles.createNewButtonText}>Create new flashcards</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.homeIndicator} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    backgroundColor: '#3B82F6',
  },
  cardCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardInfoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardsLeft: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  flashcard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  flashcardBack: {
    backgroundColor: '#D1FAE5',
  },
  flashcardText: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    color: '#111827',
    fontWeight: '500',
  },
  helperText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navigationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrongButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  wrongButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  correctButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  correctButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  completionCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  completionCircleSuccess: {
    backgroundColor: '#D1FAE5',
  },
  completionCircleRetry: {
    backgroundColor: '#FED7AA',
  },
  emojiIcon: {
    fontSize: 72,
  },
  completionScore: {
    fontSize: 56,
    fontWeight: '700',
    marginBottom: 16,
  },
  completionScoreSuccess: {
    color: '#10B981',
  },
  completionScoreRetry: {
    color: '#F97316',
  },
  completionMessage: {
    fontSize: 24,
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
  errorText: {
    marginTop: 16,
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
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
