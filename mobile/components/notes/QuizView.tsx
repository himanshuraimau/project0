import React, { useState, useEffect } from "react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import {
  StatusBar,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { notesApi } from "@/lib/api";
import type { Quiz } from "@/lib/api/types";
import BackButton from "@/components/ui/BackButton";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useTheme } from "@/lib/hooks/useTheme";

interface QuizViewProps {
  noteId: string;
}

type QuizState = "loading" | "initial" | "correct" | "wrong" | "complete";

interface QuizQuestion {
  id: number;
  type: "multiple_choice" | "true_false";
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizContent {
  questions: QuizQuestion[];
}

export default function QuizView({ noteId }: QuizViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === "dark";
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("initial");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startTime] = useState(Date.now());
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (noteId) {
      fetchQuiz();
    }
  }, [noteId]);

  useEffect(() => {
    if (quiz && quiz.content) {
      try {
        const content =
          typeof quiz.content === "string"
            ? JSON.parse(quiz.content)
            : quiz.content;

        if (content.questions && Array.isArray(content.questions)) {
          setQuestions(content.questions);
        } else if (content.quiz && Array.isArray(content.quiz)) {
          setQuestions(content.quiz);
        } else if (Array.isArray(content)) {
          setQuestions(content);
        } else {
          setError(
            `Invalid quiz format. Expected questions array but got keys: ${JSON.stringify(
              Object.keys(content)
            )}`
          );
        }
      } catch (err) {
        console.error("Failed to parse quiz content:", err);
        setError("Failed to parse quiz data: " + (err as Error).message);
      }
    }
  }, [quiz]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedQuiz = await notesApi.getQuiz(noteId);
      setQuiz(fetchedQuiz);
      setQuizState("initial");
    } catch (err: any) {
      console.error("Failed to fetch quiz:", err);
      if (err.message?.includes("not found")) {
        await generateQuiz();
      } else {
        setError(err.message || "Failed to load quiz");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    try {
      setLoading(true);
      setIsGenerating(true);
      setError(null);
      const generatedQuiz = await notesApi.generateQuiz({ noteId });
      setQuiz(generatedQuiz);
      setQuizState("initial");
    } catch (err: any) {
      console.error("Failed to generate quiz:", err);
      setError(err.message || "Failed to generate quiz");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleDeleteQuiz = async (skipConfirmation = false) => {
    if (isDeleting) return;

    const performDelete = async () => {
      setIsDeleting(true);
      try {
        await notesApi.deleteQuiz(noteId);
        setQuiz(null);
        setQuestions([]);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setCorrectAnswers(0);
        setStreak(0);
        setQuizState("initial");
        setShowExplanation(false);
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error("Failed to delete quiz:", err);
        setError(err.message || "Failed to delete quiz");
        throw err;
      } finally {
        setIsDeleting(false);
      }
    };

    if (skipConfirmation) {
      await performDelete();
      return;
    }

    showAlert(
      "Delete Quiz",
      "Are you sure you want to delete this quiz? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]
    );
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizState !== "initial") return;

    setSelectedAnswer(answerIndex);

    const currentQ = questions[currentQuestion];
    const selectedAnswerText = currentQ.options[answerIndex];
    const isCorrect = selectedAnswerText === currentQ.correct_answer;

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setQuizState("correct");
    } else {
      setStreak(0);
      setQuizState("wrong");
    }
  };

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setQuizState("initial");
      setShowExplanation(false);
    } else {
      setQuizState("complete");
    }
  };

  const handleToggleExplanation = () => {
    setShowExplanation((prev) => !prev);
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setStreak(0);
    setQuizState("initial");
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getScorePercentage = () => {
    return Math.round((correctAnswers / questions.length) * 100);
  };

  const getTotalQuestions = () => {
    return questions.length;
  };

  const handleShare = async () => {
    try {
      const score = getScorePercentage();
      const total = getTotalQuestions();
      const wrong = total - correctAnswers;
      const time = getElapsedTime();

      const name = user?.name || "Someone";
      const message =
        `${name} just scored ${score}% on my quiz! 🎯\n\n` +
        `✅ Correct: ${correctAnswers}/${total}\n` +
        `❌ Wrong: ${wrong}/${total}\n` +
        `⏱️ Time: ${time}\n\n` +
        `Great job!`;

      await Share.share({ message });
    } catch (error: any) {
      showAlert(error.message);
    }
  };

  const handleCreateNewQuiz = async () => {
    try {
      setLoading(true);
      await handleDeleteQuiz(true);
      await generateQuiz();
    } catch (error: any) {
      console.error("Failed to create new quiz:", error);
      showAlert("Error", "Failed to create new quiz");
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 17,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
    },
    headerComplete: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerLine: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: 20,
      marginBottom: 30,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    dotsContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 48,
    },
    dotsRow: {
      flexDirection: "row",
      width: 87.9,
      height: 5.99,
      position: "relative",
    },
    dot: {
      position: "absolute",
      width: 5.99,
      height: 5.99,
      borderRadius: 42152500,
      backgroundColor: c.border,
    },
    dotActive: {
      backgroundColor: c.info,
      width: 31.99,
    },
    questionCounter: {
      fontSize: 14,
      fontWeight: "600",
      color: c.mutedForeground,
      position: "absolute",
      right: 0,
    },
    questionHeader: {
      marginBottom: 8,
    },
    questionTitle: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 16,
      lineHeight: 24,
      color: c.mutedForeground,
    },
    progressIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      width: "100%",
      marginBottom: 16,
    },
    progressDotFilled: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.foreground,
    },
    progressLine: {
      flex: 1,
      height: 2,
      backgroundColor: c.border,
    },
    progressDotEmpty: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.background,
      borderWidth: 2,
      borderColor: c.border,
    },
    questionText: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 17,
      lineHeight: 24,
      color: c.foreground,
      marginBottom: 24,
      paddingTop: 6,
    },
    answersContainer: {
      gap: 6,
    },
    answerOption: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : c.muted,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    answerOptionCorrect: {
      backgroundColor: isDark ? "rgba(16,185,129,0.12)" : "#ECFDF5",
      borderColor: c.success,
    },
    answerOptionWrong: {
      backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
      borderColor: c.destructive,
    },
    answerLetter: {
      width: 24,
      height: 24,
      borderRadius: 999,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    answerLetterCorrect: {
      backgroundColor: c.success,
      borderColor: c.success,
    },
    answerLetterWrong: {
      backgroundColor: c.destructive,
      borderColor: c.destructive,
    },
    answerLetterText: {
      fontSize: 16,
      fontWeight: "400",
      color: c.mutedForeground,
      fontFamily: "Inter",
    },
    answerText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "400",
      color: c.foreground,
      fontFamily: "Inter",
    },
    answerTextCorrect: {
      color: c.success,
    },
    answerTextWrong: {
      color: c.destructive,
    },
    feedbackCards: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
    },
    feedbackCard: {
      flex: 1,
      flexDirection: "column",
      alignItems: "flex-start",
      padding: 17,
      paddingBottom: 1,
      gap: 4,
      borderRadius: 14,
    },
    feedbackCardStreak: {
      backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(59,130,246,0.2)" : "#DBEAFE",
    },
    feedbackCardStreakBroken: {
      backgroundColor: isDark ? "rgba(251,191,36,0.2)" : "#FED7AA",
    },
    feedbackCardContent: {
      alignSelf: "stretch",
    },
    feedbackCardTitle: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 16,
      lineHeight: 24,
      color: c.info,
    },
    feedbackCardValue: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 16,
      lineHeight: 24,
      color: c.info,
    },
    feedbackCardExplain: {
      flex: 1,
      flexDirection: "column",
      alignItems: "flex-start",
      padding: 17,
      paddingBottom: 1,
      gap: 4,
      backgroundColor: isDark ? "rgba(130,100,255,0.08)" : c.accent,
      borderWidth: 1,
      borderColor: isDark ? "rgba(130,100,255,0.15)" : c.accent,
      borderRadius: 14,
    },
    explanationBlur: {
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 16,
      borderWidth: 0.5,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    },
    explanationContainer: {
      padding: 20,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
    },
    explanationHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    explanationHeaderText: {
      fontSize: 16,
      fontWeight: "600",
      color: c.primary,
    },
    explanationText: {
      fontSize: 15,
      lineHeight: 24,
      color: c.foreground,
    },
    continueButton: {
      backgroundColor: c.success,
      borderRadius: 14,
      padding: 18,
      alignItems: "center",
      marginTop: 24,
    },
    continueButtonWrong: {
      backgroundColor: c.foreground,
    },
    continueButtonText: {
      fontSize: 18,
      fontWeight: "500",
      color: c.background,
    },
    completeContent: {
      flex: 1,
    },
    completeContentContainer: {
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 40,
    },
    ghostIconContainer: {
      marginBottom: 32,
    },
    ghostIcon: {
      width: 140,
      height: 140,
    },
    scoreContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    scoreNumber: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 60,
      lineHeight: 60,
      textAlign: "center",
      color: c.success,
    },
    scorePercent: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 40,
      lineHeight: 36,
      textAlign: "center",
      color: c.success,
      marginTop: 7,
    },
    scoreMessage: {
      fontSize: 15,
      fontWeight: "600",
      color: c.mutedForeground,
      marginBottom: 32,
    },
    summaryCards: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 32,
      alignSelf: "stretch",
    },
    summaryCard: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
    },
    summaryLabel: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      marginBottom: 4,
    },
    summaryValue: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
    },
    primaryActionButton: {
      alignSelf: "stretch",
      height: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
      borderRadius: 16,
      marginTop: 30,
      marginBottom: 12,
    },
    primaryActionButtonText: {
      fontFamily: "Inter",
      fontWeight: "500",
      fontSize: 19,
      lineHeight: 24,
      color: c.primaryForeground,
    },
    secondaryActions: {
      flexDirection: "row",
      gap: 12,
      alignSelf: "stretch",
      marginBottom: 24,
    },
    secondaryActionButton: {
      flex: 1,
      height: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : c.muted,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
    },
    secondaryActionButtonText: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 16,
      lineHeight: 24,
      color: c.foreground,
    },
    bestScore: {
      fontSize: 14,
      fontWeight: "600",
      color: c.mutedForeground,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      color: c.mutedForeground,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    errorTitle: {
      marginTop: 24,
      color: c.foreground,
      fontSize: 24,
      textAlign: "center",
      fontWeight: "500",
    },
    errorSubtitle: {
      marginTop: 12,
      color: c.mutedForeground,
      fontSize: 16,
      textAlign: "center",
      lineHeight: 24,
    },
    errorText: {
      marginTop: 16,
      color: c.destructive,
      fontSize: 16,
      textAlign: "center",
      fontWeight: "600",
    },
    generateButton: {
      marginTop: 32,
      paddingVertical: 16,
      paddingHorizontal: 32,
      backgroundColor: c.primary,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 200,
      justifyContent: "center",
    },
    generateButtonText: {
      color: c.primaryForeground,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    retryButton: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: c.primary,
      borderRadius: 12,
    },
    retryButtonText: {
      color: c.primaryForeground,
      fontSize: 16,
      fontWeight: "600",
    },
    backButtonError: {
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    backButtonErrorText: {
      color: c.mutedForeground,
      fontSize: 16,
      fontWeight: "600",
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={styles.loadingText}>
              {isGenerating ? t("quiz.generating") : t("common.loading")}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color={c.destructive} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchQuiz}>
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
    );
  }

  if (quizState === "complete") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerComplete}>
            <BackButton iconColor={c.foreground} />
          </View>

          <ScrollView
            style={styles.completeContent}
            contentContainerStyle={styles.completeContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.ghostIconContainer}>
              <Image
                source={require("@/assets/images/flinote-logo.png")}
                style={styles.ghostIcon}
                resizeMode="contain"
              />
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreNumber}>{getScorePercentage()}</Text>
              <Text style={styles.scorePercent}>%</Text>
            </View>
            <Text style={styles.scoreMessage}>
              Great job! You're making progress.
            </Text>

            <View style={styles.summaryCards}>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: isDark ? "rgba(16,185,129,0.12)" : "#ECFDF5",
                    borderColor: isDark ? "rgba(16,185,129,0.2)" : "#D0FAE5",
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: c.success }]}>
                  Correct
                </Text>
                <Text style={[styles.summaryValue, { color: c.success }]}>
                  {correctAnswers}/{getTotalQuestions()}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
                    borderColor: isDark ? "rgba(239,68,68,0.2)" : "#FFE2E2",
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: c.destructive }]}>
                  Wrong
                </Text>
                <Text style={[styles.summaryValue, { color: c.destructive }]}>
                  {getTotalQuestions() - correctAnswers}/{getTotalQuestions()}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
                    borderColor: isDark ? "rgba(59,130,246,0.2)" : "#DBEAFE",
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: c.info }]}>
                  Time
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather name="clock" size={12} color={c.info} />
                  <Text style={[styles.summaryValue, { color: c.info }]}>
                    {getElapsedTime()}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleCreateNewQuiz}
            >
              <Feather
                name="refresh-cw"
                size={20}
                color={c.primaryForeground}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryActionButtonText}>
                Create a new quiz
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={handleRetry}
              >
                <Text style={styles.secondaryActionButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={handleShare}
              >
                <Feather
                  name="share-2"
                  size={18}
                  color={c.foreground}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.secondaryActionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.bestScore}>Your best: 92%</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const currentQ = questions[currentQuestion];
  const isCorrectState = quizState === "correct";
  const isWrongState = quizState === "wrong";

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="help-circle" size={64} color={c.primary} />
            <Text style={styles.errorTitle}>No Quiz Available</Text>
            <Text style={styles.errorSubtitle}>
              Generate a quiz from this note to test your knowledge
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateQuiz}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={c.primaryForeground} />
              ) : (
                <>
                  <Feather name="zap" size={20} color={c.primaryForeground} />
                  <Text style={styles.generateButtonText}>Generate Quiz</Text>
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
    );
  }

  const answerLetters = ["A", "B", "C", "D"];

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton iconColor={c.foreground} />
          </View>
          <View style={styles.dotsContainer}>
            <View style={styles.dotsRow}>
              <View style={[styles.dot, { left: 0 }]} />
              <View style={[styles.dot, { left: 13.98 }]} />
              <View style={[styles.dot, styles.dotActive, { left: 27.95 }]} />
              <View style={[styles.dot, { left: 67.94 }]} />
              <View style={[styles.dot, { left: 81.91 }]} />
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.questionCounter}>
              {currentQuestion + 1}/{getTotalQuestions()}
            </Text>
          </View>
        </View>

        <View style={styles.headerLine} />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionTitle}>
              Question {currentQuestion + 1}
            </Text>
          </View>

          <View style={styles.progressIndicator}>
            <View style={styles.progressDotFilled} />
            <View style={styles.progressLine} />
            <View style={styles.progressDotEmpty} />
          </View>

          <Text style={styles.questionText}>{currentQ.question}</Text>

          <View style={styles.answersContainer}>
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = option === currentQ.correct_answer;
              const showCorrect = (isCorrectState || isWrongState) && isCorrect;
              const showWrong = isWrongState && isSelected && !isCorrect;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.answerOption,
                    showCorrect && styles.answerOptionCorrect,
                    showWrong && styles.answerOptionWrong,
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={quizState !== "initial"}
                >
                  <View
                    style={[
                      styles.answerLetter,
                      showCorrect && styles.answerLetterCorrect,
                      showWrong && styles.answerLetterWrong,
                    ]}
                  >
                    {showCorrect ? (
                      <Feather name="check" size={16} color={c.background} />
                    ) : showWrong ? (
                      <Feather name="x" size={16} color={c.background} />
                    ) : (
                      <Text style={styles.answerLetterText}>
                        {answerLetters[index]}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.answerText,
                      showCorrect && styles.answerTextCorrect,
                      showWrong && styles.answerTextWrong,
                    ]}
                  >
                    {option}
                  </Text>
                  {showCorrect && (
                    <Feather
                      name="check-circle"
                      size={24}
                      color={c.success}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                  {showWrong && (
                    <Feather
                      name="x-circle"
                      size={24}
                      color={c.destructive}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {(isCorrectState || isWrongState) && (
            <>
              <View style={styles.feedbackCards}>
                <TouchableOpacity
                  style={[
                    styles.feedbackCard,
                    isCorrectState
                      ? styles.feedbackCardStreak
                      : styles.feedbackCardStreakBroken,
                  ]}
                >
                  <View style={styles.feedbackCardContent}>
                    <Text style={styles.feedbackCardTitle}>
                      {isCorrectState ? "Streak" : "Streak broken"}
                    </Text>
                  </View>
                  <View style={styles.feedbackCardContent}>
                    <Text style={styles.feedbackCardValue}>
                      {isCorrectState ? `🔥 ${streak} correct` : "🔥 0 correct"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.feedbackCardExplain}
                  onPress={handleToggleExplanation}
                >
                  <View style={styles.feedbackCardContent}>
                    <Text style={[styles.feedbackCardTitle, { color: c.primary }]}>
                      {showExplanation ? "Hide Explanation" : "Explain"}
                    </Text>
                  </View>
                  <View style={styles.feedbackCardContent}>
                    <Text style={styles.feedbackCardValue}>🤔</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {showExplanation && currentQ.explanation && (
                <BlurView
                  intensity={isDark ? 25 : 12}
                  tint={isDark ? "dark" : "light"}
                  style={styles.explanationBlur}
                >
                  <View style={styles.explanationContainer}>
                    <View style={styles.explanationHeader}>
                      <Feather name="info" size={20} color={c.primary} />
                      <Text style={styles.explanationHeaderText}>
                        Explanation
                      </Text>
                    </View>
                    <Text style={styles.explanationText}>
                      {currentQ.explanation}
                    </Text>
                  </View>
                </BlurView>
              )}

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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
