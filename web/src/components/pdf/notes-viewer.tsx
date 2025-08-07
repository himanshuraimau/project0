import React, { useState, useEffect } from 'react';
import { useNotes, Note } from '@/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NotesViewerProps {
  transcriptId?: string;
  noteId?: string;
}

export function NotesViewer({ transcriptId, noteId }: NotesViewerProps) {
  const { getNotes, getNote, generateNotesFromTranscript, generateFocusedNotes, deleteNote, loading, error } = useNotes();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [showNoteTypeOptions, setShowNoteTypeOptions] = useState(false);

  // Load notes on component mount
  useEffect(() => {
    if (noteId) {
      loadSingleNote(noteId);
    } else {
      loadNotes();
    }
  }, [transcriptId, noteId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showNoteTypeOptions) {
        setShowNoteTypeOptions(false);
      }
    };
    
    if (showNoteTypeOptions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNoteTypeOptions]);

  const loadNotes = async () => {
    const result = await getNotes(transcriptId);
    if (result) {
      setNotes(result);
    }
  };

  const loadSingleNote = async (id: string) => {
    const result = await getNote(id);
    if (result) {
      setSelectedNote(result);
      setView('detail');
    }
  };

  const handleGenerateNotes = async () => {
    if (!transcriptId) return;
    
    const result = await generateNotesFromTranscript(transcriptId);
    if (result) {
      await loadNotes();
    }
  };

  const handleGenerateFocusedNotes = async (noteType: 'summary' | 'detailed' | 'action-items' | 'technical' | 'executive') => {
    if (!transcriptId) return;
    
    setShowNoteTypeOptions(false);
    const result = await generateFocusedNotes(transcriptId, noteType);
    if (result) {
      await loadNotes();
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      const success = await deleteNote(id);
      if (success) {
        await loadNotes();
        if (selectedNote?.id === id) {
          setSelectedNote(null);
          setView('list');
        }
      }
    }
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedNote(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading notes</p>
            <p className="text-sm mt-1">{error}</p>
            <Button onClick={loadNotes} className="mt-3" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detail view for a single note
  if (view === 'detail' && selectedNote) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{selectedNote.title}</CardTitle>
              <CardDescription>
                {selectedNote.transcript && (
                  <span>From: {selectedNote.transcript.originalName}</span>
                )}
                <span className="ml-2">
                  Created: {formatDate(selectedNote.createdAt)}
                </span>
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleBackToList} variant="outline" size="sm">
                Back to List
              </Button>
              <Button 
                onClick={() => handleDeleteNote(selectedNote.id)} 
                variant="destructive" 
                size="sm"
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {selectedNote.content || 'No content available'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <Card>
      <CardContent className="p-6">
        {transcriptId && (
          <div className="flex space-x-2 mb-6">
            <Button 
              onClick={handleGenerateNotes}
              disabled={loading}
              size="sm"
            >
              Generate Standard Notes
            </Button>
            <div className="relative">
              <Button 
                onClick={() => setShowNoteTypeOptions(!showNoteTypeOptions)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Generate Focused Notes ▼
              </Button>
              {showNoteTypeOptions && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-md shadow-lg z-10">
                  {[
                    { type: 'summary' as const, label: 'Summary', desc: 'Key points overview' },
                    { type: 'detailed' as const, label: 'Detailed Notes', desc: 'Comprehensive breakdown' },
                    { type: 'action-items' as const, label: 'Action Items', desc: 'Tasks and next steps' },
                    { type: 'technical' as const, label: 'Technical Focus', desc: 'Technical details' },
                    { type: 'executive' as const, label: 'Executive Brief', desc: 'Decision-maker summary' }
                  ].map(({ type, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => handleGenerateFocusedNotes(type)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                      disabled={loading}
                    >
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No notes found</p>
            {transcriptId && (
              <Button onClick={handleGenerateNotes} disabled={loading}>
                Generate AI Notes
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleViewNote(note)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm line-clamp-2 flex-1 mr-4">
                    {note.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {formatDate(note.createdAt)}
                  </Badge>
                </div>
                
                {note.transcript && (
                  <p className="text-xs text-gray-600 mb-2">
                    Source: {note.transcript.originalName}
                  </p>
                )}
                
                <p className="text-sm text-gray-700 line-clamp-3">
                  {note.content ? note.content.substring(0, 200) + '...' : 'No content available'}
                </p>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(note.updatedAt)}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewNote(note);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      View Full
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      variant="destructive"
                      size="sm"
                      className="text-xs"
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
