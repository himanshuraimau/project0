"use client";

import React, { useState } from 'react';
import { Chapter, Unit } from '@prisma/client';
import { cn } from '@/lib/utils';
import { ChapterView } from './ChapterView';
import { Play, HelpCircle, CreditCard, MessageSquare, FileSearch } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load components that might be heavy or require server calls
const FlashcardViewer = dynamic(() => import('@/components/flashcards/flashcard-viewer').then(mod => ({ default: mod.FlashcardViewer })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
});

// Simple transcript viewer component (we'll create this)
const TranscriptViewer = dynamic(() => import('./TranscriptViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
});

interface CourseContentTabsProps {
  chapter: Chapter & {
    questions: any[];
  };
  unit: Unit;
  unitIndex: number;
  chapterIndex: number;
}

export function CourseContentTabs({ chapter, unit, unitIndex, chapterIndex }: CourseContentTabsProps) {
  const [activeTab, setActiveTab] = useState("notes");

  const tabs = [
    { id: "notes", label: "Notes & Video", icon: Play },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
    { id: "flashcards", label: "Flashcards", icon: CreditCard },
    { id: "transcript", label: "Transcript", icon: FileSearch },
    { id: "chatbot", label: "Chatbot", icon: MessageSquare },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-0">
        {activeTab === "notes" && (
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <ChapterView chapter={chapter} />
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <QuizTab chapter={chapter} />
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <FlashcardsTab chapterId={chapter.id} />
          </div>
        )}

        {activeTab === "transcript" && (
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <TranscriptViewer 
              chapterId={chapter.id}
              videoId={chapter.videoId} 
              chapterName={chapter.name} 
            />
          </div>
        )}

        {activeTab === "chatbot" && (
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <ChatbotTab chapterId={chapter.id} chapterName={chapter.name} />
          </div>
        )}
      </div>
    </div>
  );
}

// Flashcards tab component with real API integration
function FlashcardsTab({ chapterId }: { chapterId: string }) {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFlashcards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chapter/${chapterId}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      if (data.success && data.data) {
        setFlashcards(data.data);
        if (data.cached) {
          console.log('Loaded cached flashcards');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError(err instanceof Error ? err.message : "Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  };

  const resetFlashcards = () => {
    setFlashcards([]);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Generating Flashcards</h3>
        <p className="text-muted-foreground text-center">
          Creating personalized study cards from your chapter content...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2 text-red-600">Error Generating Flashcards</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="space-x-2">
          <button
            onClick={generateFlashcards}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={resetFlashcards}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center p-8">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Create Study Flashcards</h3>
        <p className="text-muted-foreground mb-4">
          Generate AI-powered flashcards to help you study and memorize the key concepts from this chapter.
        </p>
        <button
          onClick={generateFlashcards}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Generate Flashcards
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Study Flashcards</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {flashcards.length} cards
          </span>
          <button
            onClick={resetFlashcards}
            className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
          >
            Generate New
          </button>
        </div>
      </div>
      <FlashcardViewer 
        flashcards={flashcards} 
        onClose={resetFlashcards} 
      />
    </div>
  );
}

// Quiz tab component optimized for tab layout
function QuizTab({ chapter }: { chapter: Chapter & { questions: any[] } }) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [questionState, setQuestionState] = React.useState<
    Record<string, boolean | null>
  >({});
  
  const checkAnswer = React.useCallback(() => {
    const newQuestionState = { ...questionState };
    chapter.questions.forEach((question) => {
      const user_answer = answers[question.id];
      if (!user_answer) return;
      if (user_answer === question.answer) {
        newQuestionState[question.id] = true;
      } else {
        newQuestionState[question.id] = false;
      }
      setQuestionState(newQuestionState);
    });
  }, [answers, questionState, chapter.questions]);

  if (!chapter.questions || chapter.questions.length === 0) {
    return (
      <div className="text-center p-8">
        <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Quiz Available</h3>
        <p className="text-muted-foreground">
          Quiz questions will appear here once the chapter content is loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Concept Check</h2>
        <div className="text-sm text-muted-foreground">
          {chapter.questions.length} question{chapter.questions.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="space-y-4">
        {chapter.questions.map((question) => {
          const options = JSON.parse(question.options) as string[];
          const state = questionState[question.id];
          return (
            <div
              key={question.id}
              className={cn(
                "p-4 rounded-xl border shadow transition-all duration-200",
                state === true
                  ? "bg-green-50 border-green-400 dark:bg-green-900/30 dark:border-green-600"
                  : state === false
                  ? "bg-red-50 border-red-400 dark:bg-red-900/30 dark:border-red-600"
                  : "bg-card border-border dark:bg-muted dark:border-border"
              )}
            >
              <h3 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2">
                {question.question}
                {state === true && <span className="text-green-600">✔️</span>}
                {state === false && <span className="text-red-600">❌</span>}
              </h3>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <label key={index} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      onChange={(e) => {
                        setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }));
                      }}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={checkAnswer}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Check Answers
        </button>
      </div>
    </div>
  );
}

// Lazy load the chatbot component
const ChapterChatbot = dynamic(() => import('./ChapterChatbot').then(mod => ({ default: mod.ChapterChatbot })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
});

// Chatbot tab component
function ChatbotTab({ chapterId, chapterName }: { chapterId: string; chapterName: string }) {
  return (
    <div className="h-[600px] relative">
      <ChapterChatbot chapterId={chapterId} chapterName={chapterName} />
    </div>
  );
}