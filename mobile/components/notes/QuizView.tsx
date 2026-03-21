import React, { useState, useEffect } from "react"
import { Feather, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useSession } from "@/lib/auth"
import { useTranslation } from "react-i18next"
import {
  StatusBar,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Share,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { notesApi } from "@/lib/api"
import type { Quiz } from "@/lib/api/types"
import { useAlert } from "@/lib/contexts/AlertContext"
import { useTheme } from "@/lib/hooks/useTheme"
import { neutral } from "@/lib/design-system"

interface QuizViewProps { noteId: string }

type QuizState = "loading" | "initial" | "correct" | "wrong" | "complete"

interface QuizQuestion {
  id: number
  type: "multiple_choice" | "true_false"
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

export default function QuizView({ noteId }: QuizViewProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizState, setQuizState] = useState<QuizState>("initial")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [streak, setStreak] = useState(0)
  const [startTime] = useState(Date.now())
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const pageBg = isDark ? neutral[950] : '#f0f0f0'
  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'

  useEffect(() => { if (noteId) fetchQuiz() }, [noteId])

  useEffect(() => {
    if (quiz && quiz.content) {
      try {
        const content = typeof quiz.content === "string" ? JSON.parse(quiz.content) : quiz.content
        if (content.questions && Array.isArray(content.questions)) setQuestions(content.questions)
        else if (content.quiz && Array.isArray(content.quiz)) setQuestions(content.quiz)
        else if (Array.isArray(content)) setQuestions(content)
        else setError("Invalid quiz format.")
      } catch (err) { setError("Failed to parse quiz data.") }
    }
  }, [quiz])

  const fetchQuiz = async () => {
    try { setLoading(true); setError(null); const q = await notesApi.getQuiz(noteId); setQuiz(q); setQuizState("initial") }
    catch (err: any) { if (err.message?.includes("not found")) await generateQuiz(); else setError(err.message || "Failed to load quiz") }
    finally { setLoading(false) }
  }

  const generateQuiz = async () => {
    try { setLoading(true); setIsGenerating(true); setError(null); const q = await notesApi.generateQuiz({ noteId }); setQuiz(q); setQuizState("initial") }
    catch (err: any) { setError(err.message || "Failed to generate quiz") }
    finally { setLoading(false); setIsGenerating(false) }
  }

  const handleDeleteQuiz = async (skipConfirmation = false) => {
    if (isDeleting) return
    const performDelete = async () => {
      setIsDeleting(true)
      try { await notesApi.deleteQuiz(noteId); setQuiz(null); setQuestions([]); setCurrentQuestion(0); setSelectedAnswer(null); setCorrectAnswers(0); setStreak(0); setQuizState("initial"); setShowExplanation(false); setLoading(false); setError(null) }
      catch (err: any) { setError(err.message || "Failed to delete quiz"); throw err }
      finally { setIsDeleting(false) }
    }
    if (skipConfirmation) { await performDelete(); return }
    showAlert("Delete Quiz", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: performDelete },
    ])
  }

  const handleAnswerSelect = (idx: number) => {
    if (quizState !== "initial") return
    setSelectedAnswer(idx)
    const currentQ = questions[currentQuestion]
    if (currentQ.options[idx] === currentQ.correct_answer) {
      setCorrectAnswers(p => p + 1); setStreak(p => p + 1); setQuizState("correct")
    } else { setStreak(0); setQuizState("wrong") }
  }

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(p => p + 1); setSelectedAnswer(null); setQuizState("initial"); setShowExplanation(false)
    } else setQuizState("complete")
  }

  const handleRetry = () => { setCurrentQuestion(0); setSelectedAnswer(null); setCorrectAnswers(0); setStreak(0); setQuizState("initial") }

  const getElapsedTime = () => { const e = Math.floor((Date.now() - startTime) / 1000); return `${Math.floor(e / 60)}:${(e % 60).toString().padStart(2, "0")}` }
  const getScorePercentage = () => Math.round((correctAnswers / questions.length) * 100)

  const handleShare = async () => {
    try {
      const name = user?.name || "Someone"
      await Share.share({ message: `${name} scored ${getScorePercentage()}% on a Flinote quiz!\n\n\u2705 ${correctAnswers}/${questions.length} correct\n\u23F1 ${getElapsedTime()}` })
    } catch (e: any) { showAlert(e.message) }
  }

  const handleCreateNewQuiz = async () => {
    try { setLoading(true); await handleDeleteQuiz(true); await generateQuiz() }
    catch (e: any) { showAlert("Error", "Failed to create new quiz"); setLoading(false) }
  }

  // Loading
  if (loading) {
    return (
      <View style={[s.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={s.safe}>
          <View style={s.stateWrap}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[s.stateText, { color: c.mutedForeground }]}>{isGenerating ? t("quiz.generating") : t("common.loading")}</Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // Error
  if (error) {
    return (
      <View style={[s.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}><Feather name="arrow-left" size={24} color={c.foreground} /></Pressable>
            <Text style={[s.headerTitle, { color: c.foreground }]}>Quiz</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={s.stateWrap}>
            <Feather name="alert-circle" size={44} color={c.destructive} />
            <Text style={[s.stateTitle, { color: c.foreground }]}>Something went wrong</Text>
            <Text style={[s.stateText, { color: c.mutedForeground }]}>{error}</Text>
            <Pressable style={[s.primaryBtn, { backgroundColor: c.primary }]} onPress={fetchQuiz}>
              <Text style={[s.primaryBtnText, { color: c.primaryForeground }]}>Retry</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // No quiz
  if (questions.length === 0) {
    return (
      <View style={[s.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}><Feather name="arrow-left" size={24} color={c.foreground} /></Pressable>
            <Text style={[s.headerTitle, { color: c.foreground }]}>Quiz</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={s.stateWrap}>
            <View style={[s.emptyIcon, { backgroundColor: isDark ? 'rgba(79,59,231,0.1)' : 'rgba(79,59,231,0.06)' }]}>
              <Ionicons name="bulb" size={36} color={c.primary} />
            </View>
            <Text style={[s.stateTitle, { color: c.foreground }]}>No Quiz Yet</Text>
            <Text style={[s.stateText, { color: c.mutedForeground }]}>Generate a quiz to test your knowledge</Text>
            <Pressable style={[s.primaryBtn, { backgroundColor: c.primary }]} onPress={generateQuiz}>
              <Ionicons name="flash" size={18} color={c.primaryForeground} />
              <Text style={[s.primaryBtnText, { color: c.primaryForeground }]}>Generate Quiz</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // Complete
  if (quizState === "complete") {
    const score = getScorePercentage()
    const scoreColor = score >= 70 ? '#34C759' : score >= 40 ? '#FF9500' : '#FF3B30'

    return (
      <View style={[s.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={s.safe} edges={['top']}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}><Feather name="arrow-left" size={24} color={c.foreground} /></Pressable>
            <Text style={[s.headerTitle, { color: c.foreground }]}>Results</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={s.completeContent} showsVerticalScrollIndicator={false}>
            <View style={[s.scoreCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[s.scoreNum, { color: scoreColor }]}>{score}%</Text>
              <Text style={[s.scoreMsg, { color: c.mutedForeground }]}>
                {score >= 80 ? "Excellent work!" : score >= 60 ? "Good progress!" : "Keep practicing!"}
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
                <Text style={[s.statValue, { color: '#FF3B30' }]}>{questions.length - correctAnswers}</Text>
                <Text style={[s.statLabel, { color: c.mutedForeground }]}>Wrong</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: isDark ? 'rgba(0,122,255,0.1)' : '#EFF6FF', borderColor: isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.12)' }]}>
                <Ionicons name="time" size={20} color="#007AFF" />
                <Text style={[s.statValue, { color: '#007AFF' }]}>{getElapsedTime()}</Text>
                <Text style={[s.statLabel, { color: c.mutedForeground }]}>Time</Text>
              </View>
            </View>

            <Pressable style={({ pressed }) => [s.primaryBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1, width: '100%' }]} onPress={handleCreateNewQuiz}>
              <Ionicons name="refresh" size={18} color={c.primaryForeground} />
              <Text style={[s.primaryBtnText, { color: c.primaryForeground }]}>New Quiz</Text>
            </Pressable>
            <View style={s.secondaryRow}>
              <Pressable style={({ pressed }) => [s.secondaryBtn, { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }]} onPress={handleRetry}>
                <Text style={[s.secondaryBtnText, { color: c.foreground }]}>Try Again</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [s.secondaryBtn, { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 }]} onPress={handleShare}>
                <Feather name="share-2" size={16} color={c.foreground} />
                <Text style={[s.secondaryBtnText, { color: c.foreground }]}>Share</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    )
  }

  // Quiz in progress
  const currentQ = questions[currentQuestion]
  const isCorrectState = quizState === "correct"
  const isWrongState = quizState === "wrong"
  const answered = isCorrectState || isWrongState
  const progress = (currentQuestion + 1) / questions.length
  const answerLetters = ["A", "B", "C", "D"]

  return (
    <View style={[s.container, { backgroundColor: pageBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Feather name="arrow-left" size={24} color={c.foreground} /></Pressable>
          <Text style={[s.headerTitle, { color: c.foreground }]}>
            {currentQuestion + 1} of {questions.length}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress bar */}
        <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={[s.progressFill, { backgroundColor: c.primary, width: `${progress * 100}%` }]} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Question card */}
          <View style={[s.questionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[s.questionLabel, { color: c.mutedForeground }]}>QUESTION {currentQuestion + 1}</Text>
            <Text style={[s.questionText, { color: c.foreground }]}>{currentQ.question}</Text>
          </View>

          {/* Answers */}
          <View style={s.answersWrap}>
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx
              const isCorrect = option === currentQ.correct_answer
              const showCorrect = answered && isCorrect
              const showWrong = isWrongState && isSelected && !isCorrect

              const optionBg = showCorrect
                ? (isDark ? 'rgba(52,199,89,0.1)' : '#F0FDF4')
                : showWrong
                  ? (isDark ? 'rgba(255,59,48,0.1)' : '#FEF2F2')
                  : cardBg
              const optionBorder = showCorrect ? '#34C759' : showWrong ? '#FF3B30' : cardBorder

              return (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [s.answerOption, { backgroundColor: optionBg, borderColor: optionBorder, opacity: pressed && !answered ? 0.7 : 1 }]}
                  onPress={() => handleAnswerSelect(idx)}
                  disabled={answered}
                >
                  <View style={[s.answerCircle, showCorrect && { backgroundColor: '#34C759', borderColor: '#34C759' }, showWrong && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' }, !showCorrect && !showWrong && { borderColor: isDark ? neutral[600] : neutral[300] }]}>
                    {showCorrect ? <Feather name="check" size={14} color="#fff" />
                      : showWrong ? <Feather name="x" size={14} color="#fff" />
                        : <Text style={[s.answerLetter, { color: c.mutedForeground }]}>{answerLetters[idx]}</Text>}
                  </View>
                  <Text style={[s.answerText, { color: showCorrect ? '#34C759' : showWrong ? '#FF3B30' : c.foreground }]}>{option}</Text>
                </Pressable>
              )
            })}
          </View>

          {/* Feedback */}
          {answered && (
            <>
              <View style={s.feedbackRow}>
                <View style={[s.feedbackCard, { backgroundColor: isCorrectState ? (isDark ? 'rgba(52,199,89,0.08)' : '#F0FDF4') : (isDark ? 'rgba(255,149,0,0.08)' : '#FFF8EE'), borderColor: isCorrectState ? (isDark ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.12)') : (isDark ? 'rgba(255,149,0,0.15)' : 'rgba(255,149,0,0.12)') }]}>
                  <Text style={[s.feedbackLabel, { color: isCorrectState ? '#34C759' : '#FF9500' }]}>
                    {isCorrectState ? "Streak" : "Streak broken"}
                  </Text>
                  <Text style={[s.feedbackValue, { color: isCorrectState ? '#34C759' : '#FF9500' }]}>
                    {isCorrectState ? `\uD83D\uDD25 ${streak}` : "\uD83D\uDD25 0"}
                  </Text>
                </View>
                <Pressable
                  style={[s.feedbackCard, { backgroundColor: isDark ? 'rgba(79,59,231,0.08)' : 'rgba(79,59,231,0.04)', borderColor: isDark ? 'rgba(79,59,231,0.15)' : 'rgba(79,59,231,0.1)' }]}
                  onPress={() => setShowExplanation(p => !p)}
                >
                  <Text style={[s.feedbackLabel, { color: c.primary }]}>{showExplanation ? "Hide" : "Explain"}</Text>
                  <Text style={s.feedbackValue}>{"\uD83E\uDD14"}</Text>
                </Pressable>
              </View>

              {showExplanation && currentQ.explanation && (
                <View style={[s.explanationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={s.explanationHeader}>
                    <Ionicons name="bulb" size={18} color={c.primary} />
                    <Text style={[s.explanationTitle, { color: c.primary }]}>Explanation</Text>
                  </View>
                  <Text style={[s.explanationText, { color: c.foreground }]}>{currentQ.explanation}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [s.continueBtn, { backgroundColor: isCorrectState ? '#34C759' : c.foreground, opacity: pressed ? 0.85 : 1 }]}
                onPress={handleContinue}
              >
                <Text style={[s.continueBtnText, { color: isCorrectState ? '#fff' : c.background }]}>
                  {currentQuestion < questions.length - 1 ? "Continue" : "See Results"}
                </Text>
                <Feather name="arrow-right" size={18} color={isCorrectState ? '#fff' : c.background} />
              </Pressable>
            </>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  questionCard: { borderRadius: 18, borderWidth: 1, padding: 22, marginBottom: 20 },
  questionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 },
  questionText: { fontSize: 18, fontWeight: '600', lineHeight: 26, letterSpacing: -0.3 },

  answersWrap: { gap: 10 },
  answerOption: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, borderWidth: 1, gap: 14 },
  answerCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  answerLetter: { fontSize: 14, fontWeight: '600' },
  answerText: { flex: 1, fontSize: 16, fontWeight: '500', lineHeight: 22 },

  feedbackRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  feedbackCard: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, gap: 4 },
  feedbackLabel: { fontSize: 13, fontWeight: '600' },
  feedbackValue: { fontSize: 16 },

  explanationCard: { borderRadius: 14, borderWidth: 1, padding: 18, marginTop: 12 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  explanationTitle: { fontSize: 15, fontWeight: '600' },
  explanationText: { fontSize: 15, lineHeight: 23 },

  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 16, marginTop: 20 },
  continueBtnText: { fontSize: 17, fontWeight: '600' },

  // Complete screen
  completeContent: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  scoreCard: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', width: '100%', marginBottom: 20 },
  scoreNum: { fontSize: 56, fontWeight: '700', letterSpacing: -2 },
  scoreMsg: { fontSize: 16, fontWeight: '500', marginTop: 8 },

  statsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 24 },
  statCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500' },

  secondaryRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 10 },
  secondaryBtn: { flex: 1, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },

  // Shared
  stateWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  stateTitle: { marginTop: 16, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  stateText: { marginTop: 8, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyIcon: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 16, marginTop: 24, paddingHorizontal: 28 },
  primaryBtnText: { fontSize: 17, fontWeight: '600' },
})
