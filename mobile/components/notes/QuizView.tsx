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
import type { Quiz } from '@/lib/api/types'

interface QuizViewProps {
  noteId: string
}

type QuizState = 'loading' | 'initial' | 'correct' | 'wrong' | 'complete'

interface QuizQuestion {
  id: number
  type: 'multiple_choice' | 'true_false'
  question: string
  options: string[]
  correct_answer: string  // Backend returns the actual answer text, not an index
  explanation: string
}

interface QuizContent {
  questions: QuizQuestion[]
}

export default function QuizView({ noteId }: QuizViewProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizState, setQuizState] = useState<QuizState>('initial')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [streak, setStreak] = useState(0)
  const [startTime] = useState(Date.now())
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [showExplanation, setShowExplanation] = useState(false)

  // Set up Clerk token getter on mount
  useEffect(() => {
    setClerkTokenGetter(getToken)
  }, [getToken])

  // Fetch quiz data on mount
  useEffect(() => {
    if (noteId) {
      fetchQuiz()
    }
  }, [noteId])

  // Parse quiz content when quiz is loaded
  useEffect(() => {
    if (quiz && quiz.content) {
      try {
        console.log('Raw quiz content:', quiz.content)
        console.log('Quiz content type:', typeof quiz.content)
        
        const content = typeof quiz.content === 'string' 
          ? JSON.parse(quiz.content) 
          : quiz.content
        
        console.log('Parsed content:', content)
        console.log('Content structure:', JSON.stringify(content, null, 2))
        
        // Try multiple possible structures
        if (content.questions && Array.isArray(content.questions)) {
          console.log('Found questions array with', content.questions.length, 'questions')
          setQuestions(content.questions)
        } else if (content.quiz && Array.isArray(content.quiz)) {
          // Handle case where content has "quiz" key instead of "questions"
          console.log('Found quiz array with', content.quiz.length, 'questions')
          setQuestions(content.quiz)
        } else if (Array.isArray(content)) {
          // Handle case where content is directly an array of questions
          console.log('Content is directly an array with', content.length, 'items')
          setQuestions(content)
        } else {
          console.error('Invalid quiz format. Content:', content)
          console.error('Expected: { questions: [...] } or { quiz: [...] } or [...]')
          console.error('Got keys:', Object.keys(content))
          setError(`Invalid quiz format. Expected questions array but got keys: ${JSON.stringify(Object.keys(content))}`)
        }
      } catch (err) {
        console.error('Failed to parse quiz content:', err)
        console.error('Quiz content that failed:', quiz.content)
        setError('Failed to parse quiz data: ' + (err as Error).message)
      }
    }
  }, [quiz])

  const fetchQuiz = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedQuiz = await notesApi.getQuiz(noteId)
      setQuiz(fetchedQuiz)
      setQuizState('initial')
    } catch (err: any) {
      console.error('Failed to fetch quiz:', err)
      // If quiz doesn't exist, try to generate it
      if (err.message?.includes('not found')) {
        await generateQuiz()
      } else {
        setError(err.message || 'Failed to load quiz')
      }
    } finally {
      setLoading(false)
    }
  }

  const generateQuiz = async () => {
    try {
      setLoading(true)
      const generatedQuiz = await notesApi.generateQuiz({ noteId })
      setQuiz(generatedQuiz)
      setQuizState('initial')
    } catch (err: any) {
      console.error('Failed to generate quiz:', err)
      setError(err.message || 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizState !== 'initial') return
    
    setSelectedAnswer(answerIndex)
    
    const currentQ = questions[currentQuestion]
    const selectedAnswerText = currentQ.options[answerIndex]
    
    // Log for debugging
    console.log('Selected answer index:', answerIndex)
    console.log('Selected answer text:', selectedAnswerText)
    console.log('Correct answer from backend:', currentQ.correct_answer)
    
    // Backend returns the actual answer text (e.g., "Option B", "True"), not an index
    const isCorrect = selectedAnswerText === currentQ.correct_answer
    console.log('Is correct?', isCorrect)
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1)
      setStreak(prev => prev + 1)
      setQuizState('correct')
    } else {
      setStreak(0)
      setQuizState('wrong')
    }
  }

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setSelectedAnswer(null)
      setQuizState('initial')
      setShowExplanation(false) // Reset explanation when moving to next question
    } else {
      setQuizState('complete')
    }
  }

  const handleToggleExplanation = () => {
    setShowExplanation(prev => !prev)
  }

  const handleRetry = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setCorrectAnswers(0)
    setStreak(0)
    setQuizState('initial')
  }

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getScorePercentage = () => {
    return Math.round((correctAnswers / questions.length) * 100)
  }

  const getTotalQuestions = () => {
    return questions.length
  }

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>
              {quiz ? 'Loading quiz...' : 'Generating quiz...'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchQuiz}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
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

  // Render complete state
  if (quizState === 'complete') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Header - Back button only */}
          <View style={styles.headerComplete}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>4:26</Text>
            </View>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            >
              <Feather name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.completeContent}
            contentContainerStyle={styles.completeContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Ghost Icon */}
            <View style={styles.ghostIconContainer}>
              <LinearGradient
                colors={['#1F2937', '#111827']}
                style={styles.ghostIconBox}
              >
                <Text style={styles.ghostIcon}>👻</Text>
              </LinearGradient>
            </View>

            {/* Score */}
            <Text style={styles.scoreText}>{getScorePercentage()}%</Text>
            <Text style={styles.scoreMessage}>Great job! You're making progress.</Text>

            {/* Summary Cards */}
            <View style={styles.summaryCards}>
              <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.summaryLabel}>Correct</Text>
                <Text style={styles.summaryValue}>{correctAnswers}/{getTotalQuestions()}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.summaryLabel}>Wrong</Text>
                <Text style={styles.summaryValue}>{getTotalQuestions() - correctAnswers}/{getTotalQuestions()}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
                <Feather name="clock" size={16} color="#1E40AF" style={{ marginBottom: 4 }} />
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{getElapsedTime()}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.primaryActionButton}>
              <Feather name="refresh-cw" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionButtonText}>Create a new quiz</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity 
                style={styles.secondaryActionButton}
                onPress={handleRetry}
              >
                <Text style={styles.secondaryActionButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionButton}>
                <Feather name="share-2" size={18} color="#374151" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryActionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Best Score */}
            <Text style={styles.bestScore}>Your best: 92%</Text>
          </ScrollView>

          <View style={styles.homeIndicator} />
        </SafeAreaView>
      </View>
    )
  }

  // Render question states (initial, correct, wrong)
  const currentQ = questions[currentQuestion]
  const isCorrectState = quizState === 'correct'
  const isWrongState = quizState === 'wrong'

  // If no questions loaded, show error
  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>No questions available</Text>
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

  const answerLetters = ['A', 'B', 'C', 'D']

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>4:26</Text>
            </View>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            >
              <Feather name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <Feather name="wifi" size={18} color="#222" style={{ marginRight: 8 }} />
            <Feather name="battery" size={18} color="#222" />
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            <View style={styles.dotsRow}>
              {[...Array(Math.min(5, getTotalQuestions()))].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === Math.floor(currentQuestion / (getTotalQuestions() / 5)) && styles.dotActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.questionCounter}>{currentQuestion + 1}/{getTotalQuestions()}</Text>
          </View>

          {/* Question Header */}
          <View style={styles.questionHeader}>
            <Text style={styles.questionTitle}>Question {currentQuestion + 1}</Text>
            <View style={styles.progressIndicator}>
              <View style={styles.progressDotFilled} />
              <View style={styles.progressLine} />
              <View style={styles.progressDotEmpty} />
            </View>
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{currentQ.question}</Text>

          {/* Answer Options */}
          <View style={styles.answersContainer}>
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              // Backend returns the actual answer text, not an index
              const isCorrect = option === currentQ.correct_answer
              const showCorrect = (isCorrectState || isWrongState) && isCorrect
              const showWrong = isWrongState && isSelected && !isCorrect

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.answerOption,
                    showCorrect && styles.answerOptionCorrect,
                    showWrong && styles.answerOptionWrong,
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={quizState !== 'initial'}
                >
                  <View
                    style={[
                      styles.answerLetter,
                      showCorrect && styles.answerLetterCorrect,
                      showWrong && styles.answerLetterWrong,
                    ]}
                  >
                    {showCorrect ? (
                      <Feather name="check" size={16} color="#FFFFFF" />
                    ) : showWrong ? (
                      <Feather name="x" size={16} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.answerLetterText}>{answerLetters[index]}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.answerText,
                      (showCorrect || showWrong) && styles.answerTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {showCorrect && (
                    <Feather name="check-circle" size={24} color="#10B981" style={{ marginLeft: 'auto' }} />
                  )}
                  {showWrong && (
                    <Feather name="x-circle" size={24} color="#EF4444" style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Feedback Cards */}
          {(isCorrectState || isWrongState) && (
            <>
              <View style={styles.feedbackCards}>
                <TouchableOpacity
                  style={[
                    styles.feedbackCard,
                    isCorrectState ? styles.feedbackCardStreak : styles.feedbackCardStreakBroken,
                  ]}
                >
                  <Feather
                    name={isCorrectState ? 'zap' : 'heart'}
                    size={20}
                    color={isCorrectState ? '#7C3AED' : '#F59E0B'}
                  />
                  <View style={styles.feedbackCardContent}>
                    <Text style={styles.feedbackCardTitle}>
                      {isCorrectState ? 'Streak' : 'Streak broken'}
                    </Text>
                    <Text style={styles.feedbackCardValue}>
                      {isCorrectState ? `${streak} correct` : '0 correct'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.feedbackCardExplain} onPress={handleToggleExplanation}>
                  <Text style={styles.feedbackCardExplainEmoji}>😊</Text>
                  <View style={styles.feedbackCardContent}>
                    <Text style={styles.feedbackCardTitle}>
                      {showExplanation ? 'Hide Explanation' : 'Explain'}
                    </Text>
                  </View>
                  <Feather 
                    name={showExplanation ? 'chevron-down' : 'chevron-right'} 
                    size={20} 
                    color="#7C3AED" 
                  />
                </TouchableOpacity>
              </View>

              {/* Explanation Section */}
              {showExplanation && currentQ.explanation && (
                <View style={styles.explanationContainer}>
                  <View style={styles.explanationHeader}>
                    <Feather name="info" size={20} color="#7C3AED" />
                    <Text style={styles.explanationHeaderText}>Explanation</Text>
                  </View>
                  <Text style={styles.explanationText}>{currentQ.explanation}</Text>
                </View>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  isWrongState && styles.continueButtonWrong,
                ]}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </>
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
  headerComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBadge: {
    backgroundColor: '#F87171',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  timeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressDotFilled: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#111827',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#D1D5DB',
  },
  progressDotEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 24,
  },
  answersContainer: {
    gap: 12,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F9FAFB',
  },
  answerOptionCorrect: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  answerOptionWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  answerLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  answerLetterCorrect: {
    backgroundColor: '#059669',
  },
  answerLetterWrong: {
    backgroundColor: '#DC2626',
  },
  answerLetterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  answerTextSelected: {
    color: '#FFFFFF',
  },
  feedbackCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  feedbackCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  feedbackCardStreak: {
    backgroundColor: '#E0E7FF',
  },
  feedbackCardStreakBroken: {
    backgroundColor: '#FED7AA',
  },
  feedbackCardContent: {
    flex: 1,
  },
  feedbackCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  feedbackCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  feedbackCardExplain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FCE7F3',
    gap: 12,
  },
  feedbackCardExplainEmoji: {
    fontSize: 24,
  },
  continueButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonWrong: {
    backgroundColor: '#111827',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completeContent: {
    flex: 1,
  },
  completeContentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  ghostIconContainer: {
    marginBottom: 32,
  },
  ghostIconBox: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ghostIcon: {
    fontSize: 64,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 32,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    marginBottom: 12,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 18,
  },
  secondaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  bestScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
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
  explanationContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  explanationHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
})
