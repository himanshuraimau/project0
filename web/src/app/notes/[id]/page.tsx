"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/lib/types";
import { useFlashcards } from "@/hooks/use-flashcards";
import { usePodcast } from "@/hooks/use-podcast";
import { useMindmap } from "@/hooks/use-mindmap";
import { Button } from "@/components/ui/button";
import { NotesSidebar } from "@/components/notes/sidebar";
import {
  NotesSidebarProvider,
} from "@/components/notes/sidebar-provider";
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
import { FlashcardViewer, useFlashcardKeyboard, FlashcardGenerator } from "@/components/flashcards";
import { QuizGenerator } from "@/components/quiz";
import {
  PodcastConfigurationModal,
  PodcastWithTranscript,
  PodcastGenerator,
} from "@/components/podcast";
import { MindmapGenerator } from "@/components/mindmap";
import { Trash2, MessageCircle, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { ViewNote } from "@/components/notes/view-note";
import { Navbar } from "@/components/shared/navbar";
import { NoteDetailSkeleton } from "@/components/notes/notes-skeleton";

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

export default function NoteViewPage() {
  const sidebarWidth = "280px";
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const { getNote, loading, error } = useNotes();
  const {
    flashcards,
    loading: flashcardsLoading,
    error: flashcardsError,
    generateFlashcards,
    getFlashcards,
  } = useFlashcards();

  const {
    podcast,
    segments,
    loading: podcastLoading,
    error: podcastError,
    generatePodcast,
    getPodcast,
  } = usePodcast();
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

  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    const fetchNote = async () => {
      if (noteId) {
        const fetchedNote = await getNote(noteId);
        if (fetchedNote) {
          setNote(fetchedNote);
          setEditedTitle(fetchedNote.title || "");
          setEditedContent(fetchedNote.content || "");
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
        `Failed to delete note: ${
          error instanceof Error ? error.message : "Unknown error"
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

    if (currentView === "podcast") {
      setCurrentView("notes");
      return;
    }

    setCurrentView("podcast");
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
    () => {},
    () => {},
    () => {},
    () => {},
    handleCloseFlashcards
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background">
        {/* Navbar at the very top */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <Navbar title="Notes" />
        </div>
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
    <div className="min-h-screen w-full bg-background">
      {/* Navbar at the very top */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <Navbar title="Notes" />
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
              <Card className="border-red-800 mt-2" style={{ backgroundColor: '#0A0B0D' }}>
                <CardContent className="p-3 text-sm text-red-200">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>
                      All flashcards and quizzes generated from this note will
                      also be deleted.
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

        {/* Main Content with Notes Sidebar - below navbar */}
        <div className="pt-0">
          <NotesSidebarProvider
            defaultOpen={true}
            sidebarWidth={sidebarWidth}
            sidebarWidthMobile={sidebarWidth}
          >
            <div className="min-h-[calc(100vh-64px)]">
              <NotesSidebar
                className={`${currentView === "chat" ? "pb-3" : "pb-6"} fixed top-16 left-0 h-[calc(100vh-64px)] z-10 overflow-y-auto`}
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
                podcastLoading={podcastLoading}
                mindmapLoading={mindmapLoading}
              />
              <div className="bg-background ml-[280px]">
                <main className="flex-1">
                  <div className="bg-background dark:bg-stone-950/50 border-none min-h-[calc(100vh-64px)] pl-5">
                  {/* Content based on current view */}
              {currentView === "notes" && <ViewNote note={note} />}

              {currentView === "transcript" && (
                <div className="w-full bg-transparent ml-4 p-10">
                  <Card className="rounded-xl border shadow-sm bg-white dark:bg-card px-16 py-7">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-lg">📝</span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-foreground">Transcript</h2>
                          <p className="text-sm text-muted-foreground">Audio transcript from your uploaded content</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {transcriptLoading && (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3"></div>
                            <p className="text-sm text-muted-foreground">Loading transcript...</p>
                          </div>
                        </div>
                      )}
                      {transcriptError && (
                        <div className="text-center text-red-600 py-12">
                          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl">⚠️</span>
                          </div>
                          <p className="font-medium mb-1">Error loading transcript</p>
                          <p className="text-sm">{transcriptError}</p>
                        </div>
                      )}
                      {transcript && !transcriptLoading && (
                        <div className="prose prose-stone dark:prose-invert max-w-none">
                          <div className="sticky top-0 bg-accent/5 dark:bg-accent/10 border border-accent/20 rounded-lg p-3 mb-6">
                            <h1 className="text-lg font-medium text-accent mb-1 flex items-center gap-2">
                              {note.title || "Untitled Note"} - Transcript
                            </h1>
                          </div>
                          <div className="text-stone-700 dark:text-stone-300 leading-relaxed text-base space-y-4">
                            {transcript.split('\n\n').map((paragraph, index) => (
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

              {currentView === "flashcards" && <FlashcardGenerator noteId={noteId} noteTitle={note?.title} />}

              {currentView === "quiz" && <QuizGenerator noteId={noteId} />}

              {currentView === "chat" && (
                <Card className="border-0 overflow-hidden h-[90vh] flex flex-col bg-transparent">
                  <CardHeader className="p-5 border-b border-stone-100 dark:border-stone-900 bg-muted/5">
                    <div className="flex items-center gap-4">
                      <CardTitle className="font-normal">
                        Chat about Note
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-0 flex-1 overflow-y-auto">
                    <DynamicInlineChatbot noteId={noteId} />
                  </CardContent>
                </Card>
              )}

              {currentView === "podcast" && <PodcastGenerator noteId={noteId} />}

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
                  <MindmapGenerator noteId={noteId} />
                  {mindmapError && (
                    <div className="text-center text-red-600 py-8">
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">⚠️</span>
                      </div>
                      <p className="font-medium mb-1">Error generating mindmap</p>
                      <p className="text-sm">{mindmapError}</p>
                    </div>
                  )}
                </div>
              )}
                  </div>
                </main>
              </div>
            </div>
          </NotesSidebarProvider>
        </div>
      </AlertDialog>
    </div>
  );
}
