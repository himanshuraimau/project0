"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotes, Note } from '@/hooks/use-notes';
import { useFlashcards } from '@/hooks/use-flashcards';
import { useQuiz } from '@/hooks/use-quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FlashcardViewer, useFlashcardKeyboard } from '@/components/flashcards';
import { QuizViewer } from '@/components/quiz';
import { ArrowLeft, Copy, Download, Edit, FileText, HelpCircle, Layers, X, Trash2, MessageCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/dashboard';

// Lazy load the chatbot components
const DynamicChatbot = dynamic(
  () => import('@/components/chatbot/chatbot'),
  { ssr: false }
);

const DynamicInlineChatbot = dynamic(
  () => import('@/components/chatbot/inline-chatbot'),
  { ssr: false }
);

export default function NoteViewPage() {
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
    deleteFlashcards 
  } = useFlashcards();
  const { 
    quiz, 
    loading: quizLoading, 
    error: quizError, 
    generateQuiz, 
    getQuiz,
    deleteQuiz 
  } = useQuiz();
  
  const [note, setNote] = useState<Note | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (noteId) {
      loadNote(noteId);
    }
  }, [noteId]);

  useEffect(() => {
    if (note) {
      setEditTitle(note.title || '');
      setEditContent(note.content || '');
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
      // You could add a toast notification here
    }
  };

  const handleDownload = () => {
    if (note) {
      const element = document.createElement('a');
      const file = new Blob([note.content || ''], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${note.title || 'note'}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleEdit = () => {
    if (note) {
      setIsEditing(true);
      setEditTitle(note.title || '');
      setEditContent(note.content || '');
    }
  };

  const handleSave = async () => {
    if (!note || !editTitle.trim()) {
      alert('Please enter a title for your note');
      return;
    }
    
    if (editTitle.trim() === note.title && editContent.trim() === note.content) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        if (updatedNote.success) {
          setNote(updatedNote.data);
          setIsEditing(false);
        }
      } else {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditContent('');
  };

  const handleShare = () => {
    // Placeholder for share functionality
    console.log('Share functionality to be implemented');
  };

  const handleShowTranscript = async () => {
    if (!note?.transcriptId) {
      setTranscriptError('No transcript available for this note');
      return;
    }

    if (showTranscript) {
      // If transcript is already shown, hide it
      setShowTranscript(false);
      setTranscript(null);
      setTranscriptError(null);
      return;
    }

    setShowTranscript(true);
    setTranscriptLoading(true);
    setTranscriptError(null);

    try {
      // Fetch transcript from API
      const response = await fetch(`/api/transcripts/${note.transcriptId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }
      
      const data = await response.json();
      if (data.success) {
        setTranscript(data.data.content);
      } else {
        throw new Error(data.error || 'Failed to load transcript');
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setTranscriptError(error instanceof Error ? error.message : 'Failed to load transcript');
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handleCloseTranscript = () => {
    setShowTranscript(false);
    setTranscript(null);
    setTranscriptError(null);
  };

  const handleGenerateQuiz = async () => {
    if (!noteId) return;
    
    // If quiz is already shown, hide it and show note
    if (showQuiz) {
      setShowQuiz(false);
      return;
    }
    
    try {
      // Hide other views first
      setShowFlashcards(false);
      setShowTranscript(false);
      setShowQuiz(true);
      
      // Check if quiz already exists
      const existingQuiz = await getQuiz(noteId);
      
      if (existingQuiz.length === 0) {
        // Generate new quiz if none exists
        await generateQuiz(noteId);
      }
    } catch (error) {
      console.error('Error with quiz:', error);
      setShowQuiz(false);
      // You could add a toast notification here
    }
  };

  const handleGenerateFlashcard = async () => {
    if (!noteId) return;
    
    // If flashcards are already shown, hide them and show note
    if (showFlashcards) {
      setShowFlashcards(false);
      return;
    }
    
    try {
      setShowFlashcards(true);
      
      // Check if flashcards already exist
      const existingFlashcards = await getFlashcards(noteId);
      
      if (existingFlashcards.length === 0) {
        // Generate new flashcards if none exist
        await generateFlashcards(noteId);
      }
    } catch (error) {
      console.error('Error with flashcards:', error);
      setShowFlashcards(false);
      // You could add a toast notification here
    }
  };

  const handleCloseFlashcards = () => {
    setShowFlashcards(false);
  };
  


  const handleDeleteFlashcards = async () => {
    if (!noteId) return;
    
    try {
      await deleteFlashcards(noteId);
      setShowFlashcards(false);
      // You could add a toast notification here
    } catch (error) {
      console.error('Error deleting flashcards:', error);
      // You could add a toast notification here
    }
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
  };

  const handleDeleteQuiz = async () => {
    if (!noteId) return;
    
    try {
      await deleteQuiz(noteId);
      setShowQuiz(false);
      // You could add a toast notification here
    } catch (error) {
      console.error('Error deleting quiz:', error);
      // You could add a toast notification here
    }
  };

  const handleChatWithNote = () => {
    if (!noteId) return;
    
    // Toggle chat view
    if (showChat) {
      setShowChat(false);
      return;
    }
    
    // Hide other views but keep the note visible for chat
    setShowFlashcards(false);
    setShowTranscript(false);
    setShowQuiz(false);
    setShowChat(true);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNoteContent = (content: string) => {
    if (!content) return 'No content available';
    
    // First, process markdown formatting
    let processedContent = content
      // Bold text: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      // Italic text: *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, '<em class="italic text-foreground">$1</em>')
      // Code/technical terms: `text` -> <code>text</code>
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Strikethrough: ~~text~~ -> <del>text</del>
      .replace(/~~(.*?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')
      // Links: [text](url) -> <a>text</a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks: \n\n -> </p><p>
      .replace(/\n\n/g, '</p>\n<p class="mb-3 leading-relaxed">');
    
    // Split content into lines
    const lines = processedContent.split('\n');
    const formattedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Add spacing for empty lines
        formattedLines.push('');
        continue;
      }
      
      // Check if this is a main section heading (e.g., "1. OVERVIEW / ABSTRACT")
      if (/^\d+\.\s+[A-Z\s\/]+$/.test(line)) {
        formattedLines.push(`<h2 class="text-xl font-bold text-foreground mt-6 mb-3 border-b border-border pb-2">${line}</h2>`);
      }
      // Check if this is a subsection heading (e.g., "BACKGROUND AND MOTIVATION")
      else if (/^[A-Z\s]+$/.test(line) && line.length > 3 && line.length < 50) {
        formattedLines.push(`<h3 class="text-lg font-semibold text-foreground mt-4 mb-2">${line}</h3>`);
      }
      // Check if this is a numbered list item (e.g., "1. First item")
      else if (/^\d+\.\s+/.test(line)) {
        const content = line.replace(/^\d+\.\s+/, '');
        formattedLines.push(`<li class="ml-4 mb-2">${content}</li>`);
      }
      // Check if this is a bullet point (e.g., "- Item" or "• Item")
      else if (/^[-•]\s+/.test(line)) {
        const content = line.replace(/^[-•]\s+/, '');
        formattedLines.push(`<li class="ml-4 mb-2">${content}</li>`);
      }
      // Check if this is a key term definition (e.g., "Term: Definition")
      else if (/^[A-Za-z\s]+:\s+/.test(line)) {
        const [term, definition] = line.split(': ', 2);
        formattedLines.push(`<div class="mb-3 p-3 bg-muted/30 rounded-lg border border-border"><strong class="text-foreground">${term}:</strong> ${definition}</div>`);
      }
      // Regular paragraph text
      else {
        formattedLines.push(`<p class="mb-3 leading-relaxed">${line}</p>`);
      }
    }
    
    // Join lines and wrap lists properly
    let formattedContent = formattedLines.join('\n');
    
    // Wrap consecutive list items in <ul> tags
    formattedContent = formattedContent.replace(
      /(<li[^>]*>.*?<\/li>(\s*<li[^>]*>.*?<\/li>)*)/g,
      '<ul class="list-disc ml-6 mb-4">$1</ul>'
    );
    
    return formattedContent;
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
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading note</p>
              <p className="text-sm mt-1">{error || 'Note not found'}</p>
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
      <div className={showChat ? "w-full px-0" : "w-full"}>
        {/* Header with 4 options */}
        <div className={`flex items-center justify-between ${showChat ? 'mb-3' : 'mb-6'}`}>
          <Button
            onClick={handleBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
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
            ) : (
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className={`flex items-center justify-center gap-4 ${showChat ? 'mb-3' : 'mb-6'}`}>
          <Button
            onClick={handleShowTranscript}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </Button>
          <Button
            onClick={handleGenerateQuiz}
            variant="secondary"
            className="flex items-center gap-2"
            disabled={quizLoading}
          >
            <HelpCircle className="h-4 w-4" />
            {quizLoading ? 'Generating...' : showQuiz ? 'Show Note' : 'Generate Quiz'}
          </Button>
          <Button
            onClick={handleChatWithNote}
            variant="outline"
            className="flex items-center gap-4 border-2 border-primary hover:bg-primary/5 text-primary rounded-2xl px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="p-1 bg-primary/10 rounded-full">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            {showChat ? 'Show Note' : 'Chat with Note'}
          </Button>
          <Button
            onClick={handleGenerateFlashcard}
            variant="secondary"
            className="flex items-center gap-2"
            disabled={flashcardsLoading}
          >
            <Layers className="h-4 w-4" />
            {flashcardsLoading ? 'Generating...' : showFlashcards ? 'Show Note' : 'Generate Flashcards'}
          </Button>
          {flashcards.length > 0 && showFlashcards && (
            <Button
              onClick={handleDeleteFlashcards}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Flashcards
            </Button>
          )}
          {quiz.length > 0 && showQuiz && (
            <Button
              onClick={handleDeleteQuiz}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Quiz
            </Button>
          )}
        </div>

        {/* Note Content, Flashcards, or Quiz */}
        {!showTranscript && !showFlashcards && !showQuiz && !showChat && (
          <Card className={isEditing ? 'ring-2 ring-primary/20' : ''}>
            <CardHeader>
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note title"
                    className="text-xl font-semibold border-0 p-0 h-auto text-foreground bg-transparent"
                  />
                  <div className="text-sm text-gray-600 space-y-1">
                    {note.transcript && (
                      <p>Source: {note.transcript.originalName}</p>
                    )}
                    <p>Created: {formatDate(note.createdAt)}</p>
                    <p>Last updated: {formatDate(note.updatedAt)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-xl">{note.title}</CardTitle>
                  <div className="text-sm text-gray-600 space-y-1">
                    {note.transcript && (
                      <p>Source: {note.transcript.originalName}</p>
                    )}
                    <p>Created: {formatDate(note.createdAt)}</p>
                    <p>Last updated: {formatDate(note.updatedAt)}</p>
                  </div>
                </>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Note content"
                    className="w-full min-h-[400px] p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm leading-relaxed bg-background text-foreground"
                  />
                </div>
              ) : (
                <div className="prose max-w-none">
                  <div className="text-sm leading-relaxed [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:border-b [&>h2]:border-border [&>h2]:pb-2 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-3 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>li]:mb-2 [&>div]:mb-3 [&>strong]:text-foreground [&>div]:p-3 [&>div]:bg-muted/30 [&>div]:rounded-lg [&>div]:border [&>div]:border-border [&>em]:italic [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono [&>del]:line-through [&>del]:text-muted-foreground [&>a]:text-primary [&>a]:hover:underline [&>a]:transition-colors" 
                       dangerouslySetInnerHTML={{ __html: formatNoteContent(note.content || '') }} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Flashcards Section - Replaces Note Content */}
        {!showTranscript && showFlashcards && !showChat && (
          <div className="space-y-4">
            {flashcardsLoading && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Generating flashcards...</p>
                      <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
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

        {/* Quiz Section - Replaces Note Content */}
        {!showTranscript && showQuiz && !showChat && (
          <div className="space-y-4">
            {quizLoading && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Generating quiz...</p>
                      <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
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
              <QuizViewer 
                quiz={quiz}
                onClose={handleCloseQuiz}
              />
            )}
          </div>
        )}

        {/* Chat Section - Two Column Layout */}
        {!showTranscript && showChat && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
            {/* Note Content - Left Side (2/3 width) */}
            <Card className={`lg:col-span-2 h-full flex flex-col ${isEditing ? 'ring-2 ring-primary/20' : ''}`}>
              <CardHeader className="pb-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note title"
                      className="text-lg font-semibold border-0 p-0 h-auto text-foreground bg-transparent"
                    />
                    <div className="text-xs text-gray-600 space-y-1">
                      {note.transcript && (
                        <p>Source: {note.transcript.originalName}</p>
                      )}
                      <p>Created: {formatDate(note.createdAt)}</p>
                      <p>Last updated: {formatDate(note.updatedAt)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <div className="text-xs text-gray-600 space-y-1">
                      {note.transcript && (
                        <p>Source: {note.transcript.originalName}</p>
                      )}
                      <p>Created: {formatDate(note.createdAt)}</p>
                      <p>Last updated: {formatDate(note.updatedAt)}</p>
                    </div>
                  </>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex-grow">
                {isEditing ? (
                  <div className="h-full">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Note content"
                      className="w-full h-full p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm leading-relaxed bg-background text-foreground"
                    />
                  </div>
                ) : (
                  <div className="prose max-w-none h-full">
                    <div className="text-sm leading-relaxed h-full overflow-y-auto pr-2 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:border-b [&>h2]:border-border [&>h2]:pb-2 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-3 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>li]:mb-2 [&>div]:mb-3 [&>strong]:text-foreground [&>div]:p-3 [&>div]:bg-muted/30 [&>div]:rounded-lg [&>div]:border [&>div]:border-border [&>em]:italic [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono [&>del]:line-through [&>del]:text-muted-foreground [&>a]:text-primary [&>a]:hover:underline [&>a]:transition-colors" 
                         dangerouslySetInnerHTML={{ __html: formatNoteContent(note.content || '') }} />
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
        {showTranscript && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Transcript - {note.title}</CardTitle>
              <div className="text-sm text-gray-600 space-y-1">
                {note.transcript && (
                  <p>Source: {note.transcript.originalName}</p>
                )}
                <p>Created: {formatDate(note.createdAt)}</p>
                <p>Last updated: {formatDate(note.updatedAt)}</p>
              </div>
            </CardHeader>
            <CardContent>
              {transcriptLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading transcript...</p>
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
        )}
      </div>
    </DashboardLayout>
  );
}
