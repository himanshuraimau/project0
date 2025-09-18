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
  NotesSidebarContent,
} from "@/components/notes/sidebar-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { FlashcardViewer, useFlashcardKeyboard } from "@/components/flashcards";
import { QuizViewer, QuizGenerator } from "@/components/quiz";
import {
  PodcastConfigurationModal,
  PodcastWithTranscript,
} from "@/components/podcast";
import { MindmapGenerator } from "@/components/mindmap";
import {
  ArrowLeft,
  Mic,
  Trash2,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { MarkdownRenderer } from "@/components/mdx-renderer";
import { SimpleEditor } from "@/components/notes/simple-editor";
import { ViewNote } from "@/components/notes/view-note";
import { Navbar } from "@/components/shared/navbar";

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

export default function NoteViewPage() {
  const sidebarWidth = "280px";
  const collapsedWidth = "4rem";
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
  // Define view types for better type safety
  type ViewType =
    | "notes"
    | "transcript"
    | "quiz"
    | "flashcards"
    | "chat"
    | "podcast"
    | "mindmap";

  // Single source of truth for current view
  const [currentView, setCurrentView] = useState<ViewType>("notes");

  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const [showPodcastConfig, setShowPodcastConfig] = useState(false);

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

  // Add handlers for the sidebar functionality
  const handleShowNotes = () => {
    setCurrentView("notes");
  };

  const handleShowTranscript = async () => {
    if (currentView === "transcript") {
      // If transcript is already shown, go back to notes view
      setCurrentView("notes");
      setTranscript(null);
      setTranscriptError(null);
      return;
    }

    // Switch to transcript view
    setCurrentView("transcript");
    setTranscriptLoading(true);
    setTranscriptError(null);

    try {
      // Fetch transcript from API
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
    
    try {
      setCurrentView("flashcards");
      const existingFlashcards = await getFlashcards(noteId);
      if (!existingFlashcards || existingFlashcards.length === 0) {
        await generateFlashcards(noteId);
      }
    } catch (error) {
      console.error("Error with flashcards:", error);
      setCurrentView("notes");
      toast.error("Failed to generate flashcards");
    }
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

    try {
      setCurrentView("podcast");
      const existingPodcast = await getPodcast(noteId);
      if (!existingPodcast) {
        setShowPodcastConfig(true);
      }
    } catch (error) {
      console.error("Error with podcast:", error);
      setCurrentView("notes");
      toast.error("Failed to generate podcast");
    }
  };

  const handlePodcastGenerate = async (config: any) => {
    setShowPodcastConfig(false);
    await generatePodcast(noteId, config);
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

  // Keyboard navigation for flashcards
  useFlashcardKeyboard(
    () => {}, // Will be handled by FlashcardViewer
    () => {}, // Will be handled by FlashcardViewer
    () => {}, // Will be handled by FlashcardViewer
    () => {}, // Will be handled by FlashcardViewer
    handleCloseFlashcards
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading note...</p>
        </div>
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
    <div className="flex w-full h-full relative">
      <AlertDialog>
        {/* Delete Confirmation Dialog Content */}
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
                This action cannot be undone. This will permanently delete
                this note and all associated content.
              </p>
              <Card className="bg-amber-50 border-amber-200 mt-2">
                <CardContent className="p-3 text-sm text-amber-800">
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

        {/* Main Content with Notes Sidebar */}
        <NotesSidebarProvider
          defaultOpen={true}
          sidebarWidth={sidebarWidth}
          sidebarWidthMobile={sidebarWidth}
        >
          <NotesSidebar
            className={currentView === "chat" ? "pb-3" : "pb-6"}
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
          <NotesSidebarContent
            sidebarWidth={sidebarWidth}
            collapsedWidth={collapsedWidth}
          >
            <Navbar title="Notes" />
            <div className="p-6">
              <div className="flex flex-row items-center justify-between w-full gap-2 mb-6">
                <div>
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>
              </div>

              {/* Content based on current view */}
              {currentView === "notes" && (
                <ViewNote note={note} />
              )}

              {currentView === "transcript" && (
                <div className="max-w-6xl w-full mx-auto">
                  <Card className="rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-xl">Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {transcriptLoading && (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">
                              Loading transcript...
                            </p>
                          </div>
                        </div>
                      )}
                      {transcriptError && (
                        <div className="text-center text-red-600 py-8">
                          <p className="font-medium">
                            Error loading transcript
                          </p>
                          <p className="text-sm mt-1">{transcriptError}</p>
                        </div>
                      )}
                      {transcript && !transcriptLoading && (
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {transcript}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentView === "flashcards" && (
                <div>
                  {flashcardsLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Generating flashcards...</p>
                    </div>
                  )}
                  {flashcards && flashcards.length > 0 && (
                    <FlashcardViewer 
                      flashcards={flashcards} 
                      onClose={handleCloseFlashcards}
                    />
                  )}
                  {flashcardsError && (
                    <div className="text-center text-red-600">
                      <p className="font-medium">Error generating flashcards</p>
                      <p className="text-sm mt-1">{flashcardsError}</p>
                    </div>
                  )}
                </div>
              )}

              {currentView === "quiz" && (
                <QuizGenerator noteId={noteId} />
              )}

              {currentView === "chat" && (
                <Card className="rounded-3xl border-0 shadow-xl p-0 overflow-hidden h-[78vh] flex flex-col">
                  <CardHeader className="pb-3 bg-muted/5 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">
                        Chat about Note
                      </CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Ask questions about the note content</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-0 flex-1 overflow-y-auto">
                    <DynamicInlineChatbot noteId={noteId} />
                  </CardContent>
                </Card>
              )}

              {currentView === "podcast" && (
                <div>
                  {podcastLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Generating podcast...</p>
                    </div>
                  )}
                  {podcast && podcast.audioUrl && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <PodcastWithTranscript
                          podcast={podcast}
                          segments={segments}
                        />
                      </div>
                      <Card className="lg:col-span-1 rounded-3xl border-0 shadow-xl p-0 overflow-hidden h-[78vh] flex flex-col">
                        <CardHeader className="pb-3 bg-muted/5 border-b border-border">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-lg">
                              Chat about Podcast
                            </CardTitle>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Ask questions about the podcast content</p>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-0 flex-1 overflow-y-auto">
                          <DynamicInlineChatbot noteId={noteId} />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {podcastError && (
                    <div className="text-center text-red-600">
                      <p className="font-medium">Error generating podcast</p>
                      <p className="text-sm mt-1">{podcastError}</p>
                    </div>
                  )}
                </div>
              )}

              {currentView === "mindmap" && (
                <div>
                  {mindmapLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Generating mindmap...</p>
                    </div>
                  )}
                  <MindmapGenerator noteId={noteId} />
                  {mindmapError && (
                    <div className="text-center text-red-600">
                      <p className="font-medium">Error generating mindmap</p>
                      <p className="text-sm mt-1">{mindmapError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </NotesSidebarContent>
        </NotesSidebarProvider>
      </AlertDialog>

      {/* Podcast Configuration Modal */}
      <PodcastConfigurationModal
        noteId={noteId}
        isOpen={showPodcastConfig}
        onClose={() => setShowPodcastConfig(false)}
        onGenerate={handlePodcastGenerate}
      />
    </div>
  );
}