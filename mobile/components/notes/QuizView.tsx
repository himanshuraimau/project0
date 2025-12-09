import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
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
import { notesApi } from "@/lib/api";
import type { Quiz } from "@/lib/api/types";
import BackButton from "@/components/ui/BackButton";
import { useAlert } from "@/lib/contexts/AlertContext";

interface QuizViewProps {
  noteId: string;
}

type QuizState = "loading" | "initial" | "correct" | "wrong" | "complete";

interface QuizQuestion {
  id: number;
  type: "multiple_choice" | "true_false";
  question: string;
  options: string[];
  correct_answer: string; // Backend returns the actual answer text, not an index
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

  // Fetch quiz data on mount
  useEffect(() => {
    if (noteId) {
      fetchQuiz();
    }
  }, [noteId]);

  // Parse quiz content when quiz is loaded
  useEffect(() => {
    if (quiz && quiz.content) {
      try {
        console.log("Raw quiz content:", quiz.content);
        console.log("Quiz content type:", typeof quiz.content);

        const content =
          typeof quiz.content === "string"
            ? JSON.parse(quiz.content)
            : quiz.content;

        console.log("Parsed content:", content);
        console.log("Content structure:", JSON.stringify(content, null, 2));

        // Try multiple possible structures
        if (content.questions && Array.isArray(content.questions)) {
          console.log(
            "Found questions array with",
            content.questions.length,
            "questions"
          );
          setQuestions(content.questions);
        } else if (content.quiz && Array.isArray(content.quiz)) {
          // Handle case where content has "quiz" key instead of "questions"
          console.log(
            "Found quiz array with",
            content.quiz.length,
            "questions"
          );
          setQuestions(content.quiz);
        } else if (Array.isArray(content)) {
          // Handle case where content is directly an array of questions
          console.log(
            "Content is directly an array with",
            content.length,
            "items"
          );
          setQuestions(content);
        } else {
          console.error("Invalid quiz format. Content:", content);
          console.error(
            "Expected: { questions: [...] } or { quiz: [...] } or [...]"
          );
          console.error("Got keys:", Object.keys(content));
          setError(
            `Invalid quiz format. Expected questions array but got keys: ${JSON.stringify(
              Object.keys(content)
            )}`
          );
        }
      } catch (err) {
        console.error("Failed to parse quiz content:", err);
        console.error("Quiz content that failed:", quiz.content);
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
      // If quiz doesn't exist, try to generate it
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
        // Reset state to show empty state with generate button
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

    // Confirm deletion with native alert
    showAlert(
      "Delete Quiz",
      "Are you sure you want to delete this quiz? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizState !== "initial") return;

    setSelectedAnswer(answerIndex);

    const currentQ = questions[currentQuestion];
    const selectedAnswerText = currentQ.options[answerIndex];

    // Log for debugging
    console.log("Selected answer index:", answerIndex);
    console.log("Selected answer text:", selectedAnswerText);
    console.log("Correct answer from backend:", currentQ.correct_answer);

    // Backend returns the actual answer text (e.g., "Option B", "True"), not an index
    const isCorrect = selectedAnswerText === currentQ.correct_answer;
    console.log("Is correct?", isCorrect);

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
      setShowExplanation(false); // Reset explanation when moving to next question
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
      const message = `${name} just scored ${score}% on my quiz! 🎯\n\n` +
        `✅ Correct: ${correctAnswers}/${total}\n` +
        `❌ Wrong: ${wrong}/${total}\n` +
        `⏱️ Time: ${time}\n\n` +
        `Great job!`;

      await Share.share({
        message,
      });
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

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>
              {isGenerating ? t("quiz.generating") : t("common.loading")}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
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

  // Render complete state
  if (quizState === "complete") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Header - Back button only */}
          <View style={styles.headerComplete}>
            <BackButton iconColor="#111827" />
          </View>

          <ScrollView
            style={styles.completeContent}
            contentContainerStyle={styles.completeContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Ghost Icon */}
            <View style={styles.ghostIconContainer}>

              <Image
                source={require("@/assets/images/main-logo.png")}
                style={styles.ghostIcon}
                resizeMode="contain"
              />
            </View>

            {/* Score */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreNumber}>{getScorePercentage()}</Text>
              <Text style={styles.scorePercent}>%</Text>
            </View>
            <Text style={styles.scoreMessage}>
              Great job! You're making progress.
            </Text>

            {/* Summary Cards */}
            <View style={styles.summaryCards}>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: "#ECFDF5",
                    borderColor: "#D0FAE5",
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: "#009966" }]}>
                  Correct
                </Text>
                <Text style={[styles.summaryValue, { color: "#004F3B" }]}>
                  {correctAnswers}/{getTotalQuestions()}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: "#FEF2F2",
                    borderColor: "#FFE2E2",
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: "#E7000B" }]}>
                  Wrong
                </Text>
                <Text style={[styles.summaryValue, { color: "#82181A" }]}>
                  {getTotalQuestions() - correctAnswers}/{getTotalQuestions()}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: "#EFF6FF",
                    borderColor: "#DBEAFE",
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: "#155DFC" }]}>
                  Time
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather
                    name="clock"
                    size={11.99}
                    color="#1C398E"
                  />
                  <Text style={[styles.summaryValue, { color: "#1C398E" }]}>
                    {getElapsedTime()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleCreateNewQuiz}
            >
              <Feather
                name="refresh-cw"
                size={20}
                color="#FFFFFF"
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
                  color="#374151"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.secondaryActionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Best Score */}
            <Text style={styles.bestScore}>Your best: 92%</Text>
          </ScrollView>

        </SafeAreaView>
      </View>
    );
  }

  // Render question states (initial, correct, wrong)
  const currentQ = questions[currentQuestion];
  const isCorrectState = quizState === "correct";
  const isWrongState = quizState === "wrong";

  // If no questions loaded, show generate quiz option
  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="help-circle" size={64} color="#7C3AED" />
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="zap" size={20} color="#FFFFFF" />
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
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton iconColor="#111827" />
            {/* {questions.length > 0 && (
              <TouchableOpacity 
                onPress={handleDeleteQuiz} 
                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                disabled={isDeleting}
                accessibilityLabel="Delete quiz"
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Feather name="trash-2" size={20} color="#EF4444" />
                )}
              </TouchableOpacity>
            )} */}
          </View>
          <View style={styles.dotsContainer}>
            <View style={styles.dotsRow}>
              {/* Dot 1 - left: 0px */}
              <View style={[styles.dot, { left: 0 }]} />
              {/* Dot 2 - left: 13.98px */}
              <View style={[styles.dot, { left: 13.98 }]} />
              {/* Active bar - left: 27.95px */}
              <View style={[styles.dot, styles.dotActive, { left: 27.95 }]} />
              {/* Dot 4 - left: 67.94px */}
              <View style={[styles.dot, { left: 67.94 }]} />
              {/* Dot 5 - left: 81.91px */}
              <View style={[styles.dot, { left: 81.91 }]} />
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.questionCounter}>
              {currentQuestion + 1}/{getTotalQuestions()}
            </Text>
          </View>
        </View>

        {/* Header bottom line */}
        <View style={styles.headerLine} />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Question Header */}
          <View style={styles.questionHeader}>
            <Text style={styles.questionTitle}>
              Question {currentQuestion + 1}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressIndicator}>
            <View style={styles.progressDotFilled} />
            <View style={styles.progressLine} />
            <View style={styles.progressDotEmpty} />
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{currentQ.question}</Text>

          {/* Answer Options */}
          <View style={styles.answersContainer}>
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              // Backend returns the actual answer text, not an index
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
                      <Feather name="check" size={16} color="#FFFFFF" />
                    ) : showWrong ? (
                      <Feather name="x" size={16} color="#FFFFFF" />
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
                      color="#00BC7D"
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                  {showWrong && (
                    <Feather
                      name="x-circle"
                      size={24}
                      color="#FB2C36"
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback Cards */}
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
                    <Text style={styles.feedbackCardTitle}>
                      {showExplanation ? "Hide Explanation" : "Explain"}
                    </Text>
                    <Feather
                      name={showExplanation ? "chevron-down" : "chevron-right"}
                      size={20}
                      color="#9810FA"
                      style={{ position: "absolute", left: 99.05, top: 12.75 }}
                    />
                  </View>
                  <View style={styles.feedbackCardContent}>
                    <Text style={styles.feedbackCardValue}>🤔</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Explanation Section */}
              {showExplanation && currentQ.explanation && (
                <View style={styles.explanationContainer}>
                  <View style={styles.explanationHeader}>
                    <Feather name="info" size={20} color="#7C3AED" />
                    <Text style={styles.explanationHeaderText}>
                      Explanation
                    </Text>
                  </View>
                  <Text style={styles.explanationText}>
                    {currentQ.explanation}
                  </Text>
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerComplete: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
    marginBottom: 30,
  },
  timeBadge: {
    backgroundColor: "#F87171",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  timeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  backButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    position: "relative",
  },
  dotsRow: {
    flexDirection: "row",
    width: 87.9,
    height: 5.99,
    position: "relative",
  },
  dotsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 48,
  },
  dot: {
    position: "absolute",
    width: 5.99,
    height: 5.99,
    borderRadius: 42152500,
    backgroundColor: "#D4D4D4",
  },
  dotActive: {
    backgroundColor: "#2B7FFF",
    width: 31.99,
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    position: "absolute",
    right: 0,
  },
  questionHeader: {
    marginBottom: 8,
  },
  questionTitle: {
    width: 78,
    height: 24,
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: "#4A5565",
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
    backgroundColor: "#111827",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#D1D5DB",
  },
  progressDotEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  questionText: {
    width: 322,
    height: 72,
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 17,
    lineHeight: 24,
    color: "#0A0A0A",
    marginBottom: 24,
    paddingTop: 6,
  },
  answersContainer: {
    gap: 6,
  },
  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 16,
    borderWidth: 1.26,
    borderColor: "#E5E5E5",
  },
  answerOptionCorrect: {
    backgroundColor: "#ECFDF5",
    borderColor: "#00BC7D",
  },
  answerOptionWrong: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FF6467",
  },
  answerLetter: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 1.26,
    borderColor: "#D4D4D4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  answerLetterCorrect: {
    backgroundColor: "#00BC7D",
    borderColor: "#00BC7D",
  },
  answerLetterWrong: {
    backgroundColor: "#FB2C36",
    borderColor: "#FB2C36",
  },
  answerLetterText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#A1A1A1",
    fontFamily: "Arimo",
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#525252",
    fontFamily: "Arimo",
  },
  answerTextSelected: {
    color: "#FFFFFF",
  },
  answerTextCorrect: {
    color: "#004F3B",
  },
  answerTextWrong: {
    color: "#82181A",
  },
  feedbackCards: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  feedbackCard: {
    width: 156.7,
    height: 86.46,
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 17.2537,
    paddingBottom: 1.25624,
    gap: 3.98,
    borderRadius: 14,
    flexGrow: 1,
  },
  feedbackCardStreak: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1.25624,
    borderColor: "#DBEAFE",
  },
  feedbackCardStreakBroken: {
    backgroundColor: "#FED7AA",
  },
  feedbackCardContent: {
    width: 122.19,
    height: 23.99,
    alignSelf: "stretch",
    flexGrow: 0,
  },
  feedbackCardTitle: {
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: "#155DFC",
  },
  feedbackCardValue: {
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: "#1C398E",
  },
  feedbackCardExplain: {
    width: 156.7,
    height: 86.46,
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 17.2537,
    paddingBottom: 1.25624,
    gap: 3.98,
    backgroundColor: "#FAF5FF",
    borderWidth: 1.25624,
    borderColor: "#F3E8FF",
    borderRadius: 14,
  },
  feedbackCardExplainEmoji: {
    fontSize: 24,
  },
  continueButton: {
    backgroundColor: "#00C950",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 24,
  },
  continueButtonWrong: {
    backgroundColor: "#111827",
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
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
  ghostIconBox: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ghostIcon: {
    width: 140,
    height: 140,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: 103,
    height: 60,
    marginBottom: 8,
  },
  scoreNumber: {
    width: 67,
    height: 60,
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 60,
    lineHeight: 60,
    textAlign: "center",
    color: "#009966",
  },
  scorePercent: {
    width: 36,
    height: 42,
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 40,
    lineHeight: 36,
    textAlign: "center",
    color: "#009966",
    marginTop: 7,
  },
  scoreText: {
    width: 103,
    height: 60,
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 60,
    lineHeight: 60,
    textAlign: "center",
    color: "#009966",
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 32,
  },
  summaryCards: {
    flexDirection: "row",
    width: 329.37,
    height: 86.46,
    gap: 12,
    marginBottom: 32,
  },
  summaryCard: {
    width: 101.79,
    height: 86.46,
    borderWidth: 1.25624,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  primaryActionButton: {
    width: 329.37,
    height: 55.98,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6441E9",
    borderRadius: 16,
    marginTop: 30,
    marginBottom: 12,
  },
  primaryActionButtonText: {
    fontFamily: "Arimo",
    fontWeight: "700",
    fontSize: 19,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
    width: 329.37,
    height: 58.49,
    marginBottom: 24,
  },
  secondaryActionButton: {
    width: 158.7,
    height: 58.49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
    borderWidth: 1.25624,
    borderColor: "#E5E5E5",
    borderRadius: 16,
  },
  secondaryActionButtonText: {
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: "#404040",
  },
  bestScore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  homeIndicator: {
    height: 6,
    backgroundColor: "#E6E6F0",
    borderRadius: 999,
    marginTop: 12,
    marginBottom: 6,
    alignSelf: "center",
    width: 120,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
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
    color: "#111827",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
  },
  errorSubtitle: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  errorText: {
    marginTop: 16,
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  generateButton: {
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 200,
    justifyContent: "center",
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonError: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonErrorText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  explanationContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#7C3AED",
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#374151",
  },
});
