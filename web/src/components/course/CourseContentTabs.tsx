"use client";

import React, { useState } from 'react';
import { Chapter } from '@prisma/client';
import { cn } from '@/lib/utils';
import { ChapterView } from './ChapterView';
import { Play, HelpCircle, CreditCard, MessageSquare, FileSearch } from 'lucide-react';
import { FlashcardItem } from '@/lib/types';
import { ChapterQuizGenerator } from './ChapterQuizGenerator';
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
    questions: Question[];
  };
}

interface Question {
  id: string;
  question: string;
  answer: string;
  options: string;
}

export function CourseContentTabs({ chapter }: CourseContentTabsProps) {
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
      <div className="flex mb-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 transition-all duration-200 rounded-xl mr-3 whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground "
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3 hover:scale-105">
                <Icon className="h-5 w-5" />
              <span className="text-md font-medium">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-0">
        {activeTab === "notes" && (
          <div className="max-w-5xl mx-auto">
            <ChapterView chapter={chapter} />
          </div>
        )}

                {activeTab === "content" && (
          <div className="w-full bg-card rounded-2xl  border p-8">
            <ChapterView chapter={chapter} />
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="w-full bg-card rounded-2xl border p-8">
            <QuizTab chapterId={chapter.id} />
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="w-full bg-card rounded-2xl  border p-8">
            <FlashcardsTab chapterId={chapter.id} />
          </div>
        )}

        {activeTab === "transcript" && (
          <div className="w-full bg-card rounded-2xl  border p-8">
            <TranscriptViewer 
              chapterId={chapter.id}
              videoId={chapter.videoId} 
              chapterName={chapter.name} 
            />
          </div>
        )}

        {activeTab === "chatbot" && (
          <div className="w-full rounded-2xl">
            <ChatbotTab chapterId={chapter.id} chapterName={chapter.name} />
          </div>
        )}
      </div>
    </div>
  );
}

// Quiz tab component with generate button
function QuizTab({ chapterId }: { chapterId: string }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateQuiz = async () => {
    setLoading(true);
    // The ChapterQuizGenerator will handle the actual generation
    setShowQuiz(true);
    setLoading(false);
  };

  const handleReset = () => {
    setShowQuiz(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Generating Quiz</h3>
        <p className="text-muted-foreground text-center">
          Creating personalized quiz questions from your chapter content...
        </p>
      </div>
    );
  }

  if (!showQuiz) {
    return (
      <div className="text-center p-8">
        <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Test Your Knowledge</h3>
        <p className="text-muted-foreground mb-4">
          Generate AI-powered quiz questions to test your understanding and reinforce the key concepts from this chapter.
        </p>
        <button
          onClick={handleGenerateQuiz}
          className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
        >
          Generate Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quiz Questions</h3>
        <button
          onClick={handleReset}
          className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
        >
          Generate New
        </button>
      </div>
      <ChapterQuizGenerator key={`quiz-${chapterId}`} chapterId={chapterId} variant="clean" />
    </div>
  );
}

// Flashcards tab component with real API integration
function FlashcardsTab({ chapterId }: { chapterId: string }) {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
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
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
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
          className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
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