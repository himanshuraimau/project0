"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/lib/types";
import { useFlashcards } from "@/hooks/use-flashcards";
import { useMindmap } from "@/hooks/use-mindmap";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotesSidebar } from "@/components/notes/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useFlashcardKeyboard,
  FlashcardGenerator,
} from "@/components/flashcards";
import { QuizGenerator } from "@/components/quiz";
import { PodcastPage } from "@/components/podcast";
import { MindmapGenerator } from "@/components/mindmap";
import { Trash2, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { ViewNote } from "@/components/notes/view-note";
import { NoteDetailSkeleton } from "@/components/notes/notes-skeleton";

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

export default function NoteViewPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const { getNote, loading, error } = useNotes();
  const { loading: flashcardsLoading } = useFlashcards();

  const {
    loading: mindmapLoading,
    error: mindmapError,
    generateMindmap,
    getMindmap,
  } = useMindmap();

  const [note, setNote] = useState<Note | null>(null);
  type ViewType =
    | "notes"
    | "transcript"
    | "quiz"
    | "flashcards"
    | "chat"
    | "podcast"
    | "mindmap";

  const [currentView, setCurrentView] = useState<ViewType>("notes");

  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const handleNoteUpdate = (updatedNote: Note) => {
    setNote(updatedNote);
  };

  useEffect(() => {
    const fetchNote = async () => {
      if (noteId) {
        const fetchedNote = await getNote(noteId);
        if (fetchedNote) {
          setNote(fetchedNote);
        }
      }
    };

    fetchNote();
  }, [noteId]); // Removed getNote from dependencies to prevent infinite loop

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleDeleteNote = async () => {
    if (!noteId) return;

    const loadingToast = toast.loading("Deleting note...", {
      position: "top-center",
    });

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`
        );
      }

      toast.success("Note deleted successfully", {
        duration: 3000,
        position: "top-center",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(
        `Failed to delete note: ${error instanceof Error ? error.message : "Unknown error"
        }`,
        {
          duration: 5000,
          position: "top-center",
        }
      );
    }
  };

  const handleShowNotes = () => {
    setCurrentView("notes");

    // Focus management for accessibility
    setTimeout(() => {
      const notesElement = document.querySelector('[data-testid="view-note"]');
      if (notesElement && notesElement instanceof HTMLElement) {
        notesElement.focus();
      }
    }, 100);
  };

  const handleShowTranscript = async () => {
    if (currentView === "transcript") {
      setCurrentView("notes");
      setTranscript(null);
      setTranscriptError(null);
      return;
    }

    setCurrentView("transcript");
    setTranscriptLoading(true);
    setTranscriptError(null);

    try {
      const response = await fetch(`/api/transcripts/${note?.transcriptId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transcript");
      }

      const data = await response.json();
      if (data.success) {
        setTranscript(data.data.content);
      } else {
        throw new Error(data.error || "Failed to load transcript");
      }
    } catch (error) {
      console.error("Error fetching transcript:", error);
      setTranscriptError(
        error instanceof Error ? error.message : "Failed to load transcript"
      );
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!noteId) return;
    setCurrentView("quiz");
  };

  const handleChatWithNote = () => {
    if (!noteId) return;

    if (currentView === "chat") {
      setCurrentView("notes");
      return;
    }

    setCurrentView("chat");
  };

  const handleGenerateFlashcard = async () => {
    if (!noteId) return;

    setCurrentView("flashcards");
  };

  const handleCloseFlashcards = () => {
    setCurrentView("notes");
  };

  const handleGeneratePodcast = async () => {
    if (!noteId) return;
    setCurrentView("podcast");

    // Focus management for accessibility
    setTimeout(() => {
      const podcastElement = document.querySelector(
        '[data-testid="podcast-generator"]'
      );
      if (podcastElement && podcastElement instanceof HTMLElement) {
        podcastElement.focus();
      }
    }, 100);
  };

  const handleGenerateMindmap = async () => {
    if (!noteId) return;

    try {
      setCurrentView("mindmap");
      const existingMindmap = await getMindmap(noteId);
      if (!existingMindmap) {
        await generateMindmap(noteId);
      }
    } catch (error) {
      console.error("Error with mindmap:", error);
      setCurrentView("notes");
      toast.error("Failed to generate mindmap");
    }
  };

  useFlashcardKeyboard(
    () => { },
    () => { },
    () => { },
    () => { },
    handleCloseFlashcards
  );

  // Add keyboard shortcuts for podcast navigation and accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Podcast shortcuts (P key)
      if (event.key === "p" || event.key === "P") {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleGeneratePodcast();
        }
      }

      // Escape key to return to notes view
      if (event.key === "Escape" && currentView !== "notes") {
        event.preventDefault();
        setCurrentView("notes");

        // Focus management for accessibility
        setTimeout(() => {
          const notesElement = document.querySelector(
            '[data-testid="view-note"]'
          );
          if (notesElement && notesElement instanceof HTMLElement) {
            notesElement.focus();
          }
        }, 100);
      }

      // Arrow key navigation between views (Alt + Arrow keys)
      if (event.altKey) {
        const views: ViewType[] = [
          "notes",
          "transcript",
          "quiz",
          "flashcards",
          "chat",
          "podcast",
          "mindmap",
        ];
        const currentIndex = views.indexOf(currentView);

        if (event.key === "ArrowRight" && currentIndex < views.length - 1) {
          event.preventDefault();
          const nextView = views[currentIndex + 1];
          if (nextView === "podcast") {
            handleGeneratePodcast();
          } else if (nextView === "quiz") {
            handleGenerateQuiz();
          } else if (nextView === "flashcards") {
            handleGenerateFlashcard();
          } else if (nextView === "mindmap") {
            handleGenerateMindmap();
          } else if (nextView === "chat") {
            handleChatWithNote();
          } else if (nextView === "transcript") {
            handleShowTranscript();
          } else {
            setCurrentView(nextView);
          }
        } else if (event.key === "ArrowLeft" && currentIndex > 0) {
          event.preventDefault();
          const prevView = views[currentIndex - 1];
          if (prevView === "podcast") {
            handleGeneratePodcast();
          } else if (prevView === "quiz") {
            handleGenerateQuiz();
          } else if (prevView === "flashcards") {
            handleGenerateFlashcard();
          } else if (prevView === "mindmap") {
            handleGenerateMindmap();
          } else if (prevView === "chat") {
            handleChatWithNote();
          } else if (prevView === "transcript") {
            handleShowTranscript();
          } else {
            setCurrentView(prevView);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentView]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background">
        <NoteDetailSkeleton />
      </div>
    );
  }

  if (error || !note) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading note</p>
            <p className="text-sm mt-1">{error || "Note not found"}</p>
            <Button onClick={handleBack} className="mt-3" size="sm">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Skip links for accessibility */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
        <a
          href="#main-content"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <a
          href="#sidebar-navigation"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md ml-2 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to navigation
        </a>
      </div>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {currentView === "podcast" &&
          "Podcast view is active. Use Escape to return to notes, or Alt+Arrow keys to navigate between views."}
        {currentView === "notes" &&
          "Notes view is active. Use Ctrl+P to generate podcast, or Alt+Arrow keys to navigate between views."}
        {currentView === "quiz" && "Quiz view is active"}
        {currentView === "flashcards" && "Flashcards view is active"}
        {currentView === "chat" && "Chat view is active"}
        {currentView === "transcript" && "Transcript view is active"}
        {currentView === "mindmap" && "Mindmap view is active"}
      </div>

      {/* Keyboard shortcuts help (hidden by default, shown on focus) */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:right-4 focus:bg-background focus:border focus:rounded-md focus:p-4 focus: focus:z-50 focus:max-w-sm">
        <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
        <ul className="text-sm space-y-1">
          <li>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+P</kbd>{" "}
            Generate Podcast
          </li>
          <li>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Escape</kbd>{" "}
            Return to Notes
          </li>
          <li>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Alt+←/→</kbd>{" "}
            Navigate Views
          </li>
        </ul>
      </div>

      <AlertDialog>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-red-600">
                Delete Note
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 mt-2">
              <p className="font-medium text-base border-l-4 border-l-red-200 pl-3 py-1">
                {note?.title}
              </p>
              <p>
                This action cannot be undone. This will permanently delete this
                note and all associated content.
              </p>
              <Card className="border-red-800 mt-2 bg-white dark:bg-[#0A0B0D]">
                <CardContent className="p-3 text-sm text-red-900 dark:text-red-200">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>
                      All flashcards, quizzes, podcasts, and other content
                      generated from this note will also be deleted.
                    </span>
                  </p>
                </CardContent>
              </Card>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
              onClick={handleDeleteNote}
            >
              <Trash2 className="h-4 w-4" />
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

        {/* Full-height sidebar and content layout */}
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            {/* Full-height Sidebar */}
            <NotesSidebar
              noteId={noteId}
              showTranscript={currentView === "transcript"}
              showQuiz={currentView === "quiz"}
              showChat={currentView === "chat"}
              showFlashcards={currentView === "flashcards"}
              showPodcast={currentView === "podcast"}
              showMindmap={currentView === "mindmap"}
              onShowNotes={handleShowNotes}
              onShowTranscript={handleShowTranscript}
              onGenerateQuiz={handleGenerateQuiz}
              onChatWithNote={handleChatWithNote}
              onGenerateFlashcard={handleGenerateFlashcard}
              onGeneratePodcast={handleGeneratePodcast}
              onGenerateMindmap={handleGenerateMindmap}
              onDeleteNote={handleDeleteNote}
              quizLoading={false}
              flashcardsLoading={flashcardsLoading}
              mindmapLoading={mindmapLoading}
            />

            <SidebarInset className="flex flex-col flex-1">
              <main className="flex-1 p-0 pt-4">
                <div className="border-none transition-colors duration-200 w-full">
                  {currentView === "notes" && (
                    <div data-testid="view-note" tabIndex={-1}>
                      <ViewNote note={note} onUpdate={handleNoteUpdate} />
                    </div>
                  )}

                  {currentView === "transcript" && (
                    <div className="w-full bg-transparent p-5">
                      <Card className="rounded-xl border  bg-white dark:bg-card px-16 py-7">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                              <span className="text-lg">📝</span>
                            </div>
                            <div>
                              <h2 className="text-2xl font-semibold text-foreground">
                                Transcript
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                Transcript from your uploaded content
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {transcriptLoading && (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3"></div>
                                <p className="text-sm text-muted-foreground">
                                  Loading transcript...
                                </p>
                              </div>
                            </div>
                          )}
                          {transcriptError && (
                            <div className="text-center text-red-600 py-12">
                              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                                <span className="text-xl">⚠️</span>
                              </div>
                              <p className="font-medium mb-1">
                                Error loading transcript
                              </p>
                              <p className="text-sm">{transcriptError}</p>
                            </div>
                          )}
                          {transcript && !transcriptLoading && (
                            <div className="prose prose-stone dark:prose-invert max-w-none">
                              <div className="sticky top-0 bg-accent/30 dark:bg-accent/50 border border-accent/20 rounded-lg p-3 mb-6">
                                <h1 className="text-lg font-medium text-black dark:text-white/80 mb-1 flex items-center gap-2">
                                  {note.title || "Untitled Note"} - Transcript
                                </h1>
                              </div>
                              <div className="text-stone-700 dark:text-stone-300 leading-relaxed text-base space-y-4">
                                {transcript
                                  .split("\n\n")
                                  .map((paragraph, index) => (
                                    <p key={index} className="mb-4 last:mb-0">
                                      {paragraph}
                                    </p>
                                  ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {currentView === "flashcards" && (
                    <FlashcardGenerator
                      key={`flashcards-${noteId}`}
                      noteId={noteId}
                      noteTitle={note?.title}
                    />
                  )}

                  {currentView === "quiz" && (
                    <QuizGenerator key={`quiz-${noteId}`} noteId={noteId} />
                  )}

                  {currentView === "podcast" && (
                    <div
                      className="w-full bg-transparent focus:outline-none transition-all duration-300 ease-in-out"
                      data-testid="podcast-generator"
                      tabIndex={-1}
                      role="main"
                      aria-label="Podcast generation interface"
                    >
                      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                        <PodcastPage
                          key={`podcast-${noteId}`}
                          noteId={noteId}
                          noteTitle={note?.title}
                          noteContent={note?.content || undefined}
                        />
                      </div>
                    </div>
                  )}

                  {currentView === "chat" && (
                    <Card className="bg-card h-[80vh] m-10 flex flex-col border border-black/20 dark:border-white/20 rounded-3xl">
                      <CardHeader className="p-5 border-b border-stone-100 dark:border-stone-900 bg-muted/5">
                        <div className="flex items-center gap-4">
                          <CardTitle className="font-normal">
                            Chat about Note
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 p-0 flex-1 overflow-y-hidden">
                        <DynamicInlineChatbot noteId={noteId} />
                      </CardContent>
                    </Card>
                  )}

                  {currentView === "mindmap" && (
                    <div>
                      {mindmapLoading && (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3"></div>
                            <p className="text-sm text-muted-foreground">
                              Generating mindmap...
                            </p>
                          </div>
                        </div>
                      )}
                      <MindmapGenerator
                        key={`mindmap-${noteId}`}
                        noteId={noteId}
                      />
                      {mindmapError && (
                        <div className="text-center text-red-600 py-8">
                          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl">⚠️</span>
                          </div>
                          <p className="font-medium mb-1">
                            Error generating mindmap
                          </p>
                          <p className="text-sm">{mindmapError}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AlertDialog>
    </div>
  );
}
