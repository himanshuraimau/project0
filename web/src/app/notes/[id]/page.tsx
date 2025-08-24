"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/lib/types";
import { useFlashcards } from "@/hooks/use-flashcards";
import { useQuiz } from "@/hooks/use-quiz";
import { Button } from "@/components/ui/button";
import { NotesSidebar } from "@/components/notes/sidebar";
import { NotesSidebarProvider, NotesSidebarContent } from "@/components/notes/sidebar-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { QuizViewer } from "@/components/quiz";
import {
  ArrowLeft,
  Copy,
  Download,
  Edit,
  FileText,
  HelpCircle,
  Layers,
  X,
  Trash2,
  MessageCircle,
  PanelRight,
  AlertTriangle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/dashboard";
import { MarkdownRenderer } from "@/components/mdx-renderer";
import { SimpleEditor } from "@/components/notes/simple-editor";
import { ViewNote } from "@/components/notes/view-note";

// Lazy load the chatbot components
const DynamicChatbot = dynamic(() => import("@/components/chatbot/chatbot"), {
  ssr: false,
});

const DynamicInlineChatbot = dynamic(
  () => import("@/components/chatbot/inline-chatbot"),
  { ssr: false }
);

export default function NoteViewPage() {
  // We'll use the NotesSidebarProvider to manage sidebar state
  // Define sidebar width constants for consistent layout
  const sidebarWidth = "240px";
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
    deleteFlashcards,
  } = useFlashcards();
  const {
    quiz,
    loading: quizLoading,
    error: quizError,
    generateQuiz,
    getQuiz,
    deleteQuiz,
  } = useQuiz();

  const [note, setNote] = useState<Note | null>(null);
  // Define view types for better type safety
  type ViewType = 'notes' | 'transcript' | 'quiz' | 'flashcards' | 'chat';
  
  // Single source of truth for current view
  const [currentView, setCurrentView] = useState<ViewType>('notes');
  
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (noteId) {
      loadNote(noteId);
    }
  }, [noteId]);

  useEffect(() => {
    if (note) {
      setEditTitle(note.title || "");
      setEditContent(note.content || "");
    }
  }, [note]);

  const loadNote = async (id: string) => {
    const result = await getNote(id);
    if (result) {
      setNote(result);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCopy = async () => {
    if (note?.content) {
      await navigator.clipboard.writeText(note.content);
      toast("Note content copied to clipboard.");
    }
  };

  const handleDownload = () => {
    if (note) {
      const element = document.createElement("a");
      const file = new Blob([note.content || ""], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${note.title || "note"}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleEdit = () => {
    if (note) {
      setIsEditing(true);
      setEditTitle(note.title || "");
      setEditContent(note.content || "");
    }
  };

  const handleSave = async () => {
    if (!note || !editTitle.trim()) {
      toast.error("Please enter a title for your note");
      return;
    }

    if (
      editTitle.trim() === note.title &&
      editContent.trim() === note.content
    ) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      console.log("Saving note with content:", editContent.substring(0, 100) + "...");
      console.log("Note ID:", note.id);
      
      // Make sure we have a valid note ID
      if (!note.id) {
        throw new Error("Invalid note ID");
      }
      
      const apiUrl = `/api/notes/${note.id}`;
      console.log("API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });

      console.log("Response status:", response.status);
      
      // Get the response body as text first to debug
      const responseText = await response.text();
      console.log("Response body:", responseText);
      
      // Parse the JSON (if it's valid JSON)
      let updatedNote;
      try {
        updatedNote = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(updatedNote.error || "Failed to update note");
      }

      if (updatedNote.success) {
        toast.success("Note updated successfully");
        setNote(updatedNote.data);
        setIsEditing(false);
      } else {
        throw new Error(updatedNote.error || "Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error(`Failed to save note: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
  };

  const handleShare = () => {
    // Placeholder for share functionality
    console.log("Share functionality to be implemented");
  };

  const handleShowTranscript = async () => {
    if (!note?.transcriptId) {
      setTranscriptError("No transcript available for this note");
      return;
    }

    if (currentView === 'transcript') {
      // If transcript is already shown, go back to notes view
      setCurrentView('notes');
      setTranscript(null);
      setTranscriptError(null);
      return;
    }

    // Switch to transcript view
    setCurrentView('transcript');
    setTranscriptLoading(true);
    setTranscriptError(null);

    try {
      // Fetch transcript from API
      const response = await fetch(`/api/transcripts/${note.transcriptId}`);
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

  const handleCloseTranscript = () => {
    setCurrentView('notes');
    setTranscript(null);
    setTranscriptError(null);
  };

  const handleGenerateQuiz = async () => {
    if (!noteId) return;

    // If quiz is already shown, go back to notes view
    if (currentView === 'quiz') {
      setCurrentView('notes');
      return;
    }

    try {
      // Switch to quiz view
      setCurrentView('quiz');

      // Check if quiz already exists
      const existingQuiz = await getQuiz(noteId);

      if (existingQuiz.length === 0) {
        // Generate new quiz if none exists
        await generateQuiz(noteId);
      }
    } catch (error) {
      console.error("Error with quiz:", error);
      setCurrentView('notes');
      toast.error("Failed to generate quiz");
    }
  };

  const handleGenerateFlashcard = async () => {
    if (!noteId) return;

    // If flashcards are already shown, go back to notes view
    if (currentView === 'flashcards') {
      setCurrentView('notes');
      return;
    }

    try {
      // Switch to flashcards view
      setCurrentView('flashcards');

      // Check if flashcards already exist
      const existingFlashcards = await getFlashcards(noteId);

      if (existingFlashcards.length === 0) {
        // Generate new flashcards if none exist
        await generateFlashcards(noteId);
      }
    } catch (error) {
      console.error("Error with flashcards:", error);
      setCurrentView('notes');
      toast.error("Failed to generate flashcards");
    }
  };

  const handleCloseFlashcards = () => {
    setCurrentView('notes');
  };

  const handleDeleteFlashcards = async () => {
    if (!noteId) return;

    try {
      await deleteFlashcards(noteId);
      setCurrentView('notes');
      toast.success("Flashcards deleted successfully");
    } catch (error) {
      console.error("Error deleting flashcards:", error);
      toast.error("Failed to delete flashcards");
    }
  };

  const handleCloseQuiz = () => {
    setCurrentView('notes');
  };

  const handleDeleteQuiz = async () => {
    if (!noteId) return;

    try {
      await deleteQuiz(noteId);
      setCurrentView('notes');
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };
  
  // Handle the delete note action
  const handleDeleteNote = async () => {
    if (!noteId || !note) return;
    
    try {
      // Show loading toast
      const loadingToast = toast.loading("Deleting note...");
      
      // Delete the note
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      // Show success toast
      toast.success("Note deleted successfully", {
        duration: 3000,
        position: "top-center",
      });
      
      // Navigate back to dashboard after a short delay
      // This ensures the user sees the success message before navigation
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
      
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(`Failed to delete note: ${error instanceof Error ? error.message : "Unknown error"}`, {
        duration: 5000,
        position: "top-center",
      });
    }
  };

  const handleChatWithNote = () => {
    if (!noteId) return;

    // Toggle chat view
    if (currentView === 'chat') {
      setCurrentView('notes');
      return;
    }

    // Switch to chat view
    setCurrentView('chat');
  };
  
  // Add a handler for the Notes menu item
  const handleShowNotes = () => {
    setCurrentView('notes');
  };

  // Keyboard navigation for flashcards
  useFlashcardKeyboard(
    () => {}, // Will be handled by FlashcardViewer
    () => {}, // Will be handled by FlashcardViewer
    () => {}, // Will be handled by FlashcardViewer
    () => {}, // Will be handled by FlashcardViewer
    handleCloseFlashcards
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading note...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !note) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex w-full min-h-screen relative">
        <AlertDialog>
          {/* Delete Confirmation Dialog Content */}
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle className="text-red-600">Delete Note</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="space-y-3 mt-2">
                <p className="font-medium text-base border-l-4 border-l-red-200 pl-3 py-1">{note?.title}</p>
                <p>This action cannot be undone. This will permanently delete this note and all associated content.</p>
                <Card className="bg-amber-50 border-amber-200 mt-2">
                  <CardContent className="p-3 text-sm text-amber-800">
                    <p className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>All flashcards and quizzes generated from this note will also be deleted.</span>
                    </p>
                  </CardContent>
                </Card>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
                onClick={handleDeleteNote}
              >
                <Trash2 className="h-4 w-4" />
                Delete Note
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>

          {/* Sidebar with the AlertDialogTrigger */}
          <NotesSidebarProvider 
            defaultOpen={true}
            sidebarWidth={sidebarWidth}
            sidebarWidthMobile={sidebarWidth}
          >
            <NotesSidebar 
              className={currentView === 'chat' ? 'pb-3' : 'pb-6'}
              showTranscript={currentView === 'transcript'}
              showQuiz={currentView === 'quiz'}
              showChat={currentView === 'chat'}
              showFlashcards={currentView === 'flashcards'}
              onShowNotes={handleShowNotes}
              onShowTranscript={handleShowTranscript}
              onGenerateQuiz={handleGenerateQuiz}
              onChatWithNote={handleChatWithNote}
              onGenerateFlashcard={handleGenerateFlashcard}
              onDeleteNote={handleDeleteNote}
              quizLoading={quizLoading}
              flashcardsLoading={flashcardsLoading}
            />
          <NotesSidebarContent 
            sidebarWidth={sidebarWidth} 
            collapsedWidth={collapsedWidth}
          >
            <div>
              <div className="flex flex-row items-center justify-between w-full gap-2">
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
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <>
                      <Button
                        onClick={() => {
                          // Get the current title and content from the editor
                          const editor = document.querySelector('.simple-editor');
                          if (editor) {
                            const titleInput = editor.querySelector('input');
                            const contentTextarea = editor.querySelector('textarea');
                            if (titleInput && contentTextarea) {
                              setEditTitle(titleInput.value);
                              setEditContent(contentTextarea.value);
                              handleSave();
                            }
                          } else {
                            // Fallback if we can't find the editor elements
                            handleSave();
                          }
                        }}
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-7xl w-full mx-auto">
                {/* Content sections - Only one visible at a time based on currentView */}
                
                {/* Notes View */}
                {currentView === 'notes' && (
                  <>
                    {isEditing ? (
                      <SimpleEditor
                        initialTitle={note.title || ""}
                        initialContent={note.content || ""}
                        onSave={(title, content) => {
                          setEditTitle(title);
                          setEditContent(content);
                          handleSave();
                        }}
                        onCancel={() => {}}
                        isSaving={isSaving}
                      />
                    ) : (
                      <ViewNote 
                        note={note} 
                        onEdit={handleEdit}
                      />
                    )}
                  </>
                )}
                
                {/* Flashcards Section */}
                {currentView === 'flashcards' && (
                  <div className="space-y-4">
                    {flashcardsLoading && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">
                                Generating flashcards...
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                This may take a few moments
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {flashcardsError && !flashcardsLoading && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center text-red-600">
                            <p className="font-medium">Error generating flashcards</p>
                            <p className="text-sm mt-1">{flashcardsError}</p>
                            <Button
                              onClick={() => handleGenerateFlashcard()}
                              className="mt-3"
                              size="sm"
                            >
                              Try Again
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {flashcards.length > 0 && !flashcardsLoading && (
                      <FlashcardViewer
                        flashcards={flashcards}
                        onClose={handleCloseFlashcards}
                      />
                    )}
                  </div>
                )}
                
                {/* Quiz Section */}
                {currentView === 'quiz' && (
                  <div className="space-y-4">
                    {quizLoading && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">
                                Generating quiz...
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                This may take a few moments
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {quizError && !quizLoading && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center text-red-600">
                            <p className="font-medium">Error generating quiz</p>
                            <p className="text-sm mt-1">{quizError}</p>
                            <Button
                              onClick={() => handleGenerateQuiz()}
                              className="mt-3"
                              size="sm"
                            >
                              Try Again
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {quiz.length > 0 && !quizLoading && (
                      <QuizViewer quiz={quiz} onClose={handleCloseQuiz} />
                    )}
                  </div>
                )}
                
                {/* Chat Section */}
                {currentView === 'chat' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
                    {/* Note Content - Left Side (2/3 width) */}
                    <Card
                      className={`lg:col-span-2 h-full flex flex-col ${
                        isEditing ? "ring-2 ring-primary/20" : ""
                      }`}
                    >
                      <CardHeader className="pb-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Note title"
                              className="text-lg font-semibold border-0 p-0 h-auto text-foreground bg-transparent"
                            />
                          </div>
                        ) : (
                          <CardTitle className="text-lg">{note.title}</CardTitle>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0 flex-grow">
                        {isEditing ? (
                          <SimpleEditor
                            initialTitle={note.title || ""}
                            initialContent={note.content || ""}
                            onSave={(title, content) => {
                              setEditTitle(title);
                              setEditContent(content);
                              handleSave();
                            }}
                            onCancel={() => {}}
                            isSaving={isSaving}
                          />
                        ) : (
                          <div className="h-full overflow-y-auto pr-2">
                            <MarkdownRenderer
                              content={note.content || ""}
                              className="text-sm"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    {/* Chat Interface - Right Side (1/3 width) */}
                    <Card className="lg:col-span-1 rounded-3xl border-0 shadow-xl p-0 overflow-hidden h-[78vh] flex flex-col">
                      <CardHeader className="pb-3 bg-muted/5 border-b border-border">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <MessageCircle className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">Chat with Note</CardTitle>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Ask questions about your note content</p>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 p-0 flex-1 overflow-y-auto">
                        {/* Render inline chatbot component */}
                        <DynamicInlineChatbot noteId={noteId} />
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {/* Transcript Section */}
                {currentView === 'transcript' && (
                  <div className="max-w-6xl w-full mx-auto">
                    <Card>
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
                            <p className="font-medium">Error loading transcript</p>
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
              </div>
            </div>
          </NotesSidebarContent>
        </NotesSidebarProvider>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
