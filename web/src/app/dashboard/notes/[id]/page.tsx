"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotes, Note } from '@/hooks/use-notes';
import { useFlashcards } from '@/hooks/use-flashcards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard';
import { FlashcardViewer, useFlashcardKeyboard } from '@/components/flashcards';
import { ArrowLeft, Copy, Download, Edit, Share, FileText, HelpCircle, Layers, X, Trash2 } from 'lucide-react';

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
  
  const [note, setNote] = useState<Note | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  useEffect(() => {
    if (noteId) {
      loadNote(noteId);
    }
  }, [noteId]);

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
    // Placeholder for edit functionality
    console.log('Edit functionality to be implemented');
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

  const handleGenerateQuiz = () => {
    // Placeholder for generate quiz functionality
    console.log('Generate quiz functionality to be implemented');
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
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
      <div className="max-w-4xl mx-auto">
        {/* Header with 4 options */}
        <div className="flex items-center justify-between mb-6">
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
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex items-center justify-center gap-4 mb-6">
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
          >
            <HelpCircle className="h-4 w-4" />
            Generate Quiz
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
        </div>

        {/* Note Content or Flashcards */}
        {!showTranscript && !showFlashcards && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{note.title}</CardTitle>
              <div className="text-sm text-gray-600 space-y-1">
                {note.transcript && (
                  <p>Source: {note.transcript.originalName}</p>
                )}
                <p>Created: {formatDate(note.createdAt)}</p>
                <p>Last updated: {formatDate(note.updatedAt)}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {note.content || 'No content available'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Flashcards Section - Replaces Note Content */}
        {!showTranscript && showFlashcards && (
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
