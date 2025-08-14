import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/hooks/use-notes';
import { Note } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

import { MarkdownRenderer } from '@/components/mdx-renderer';
import { NotesViewerProps } from '@/lib/types';

export function NotesViewer({ transcriptId, searchQuery }: NotesViewerProps) {
  const router = useRouter();
  const { getNotes, generateNotesFromTranscript, generateFocusedNotes, deleteNote, loading, error } = useNotes();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteTypeOptions, setShowNoteTypeOptions] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [transcriptId]);

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

  const handleDeleteNote = (id: string) => {
    setNoteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteNote(noteToDelete);
      if (success) {
        await loadNotes();
        setDeleteDialogOpen(false);
        setNoteToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteNote = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  const handleViewFullNote = (noteId: string) => {
    router.push(`/dashboard/notes/${noteId}`);
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

  // Filter notes based on search query
  const filterNotes = (notes: Note[], query: string): Note[] => {
    if (!query || query.trim() === '') {
      return notes;
    }

    const searchTerm = query.toLowerCase().trim();

    return notes.filter((note) => {
      // Search in note title
      const titleMatch = note.title.toLowerCase().includes(searchTerm);

      // Search in note content
      const contentMatch = note.content?.toLowerCase().includes(searchTerm) || false;

      // Search in transcript original name
      const transcriptMatch = note.transcript?.originalName.toLowerCase().includes(searchTerm) || false;

      return titleMatch || contentMatch || transcriptMatch;
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



  // List view
  return (
    <Card className="border-0">
      <CardContent className="p-0">
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

        {(() => {
          const filteredNotes = filterNotes(notes, searchQuery || '');

          if (notes.length === 0) {
            return (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No notes found</p>
                {transcriptId && (
                  <Button onClick={handleGenerateNotes} disabled={loading}>
                    Generate AI Notes
                  </Button>
                )}
              </div>
            );
          }

          if (filteredNotes.length === 0 && searchQuery) {
            return (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-2">No notes match your search</p>
                <p className="text-sm text-gray-500">Try adjusting your search terms</p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {searchQuery && (
                <div className="text-sm text-gray-600 mb-4">
                  Showing {filteredNotes.length} of {notes.length} notes
                </div>
              )}
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewFullNote(note.id)}
                >
                  <div className="text-sm text-gray-700 line-clamp-3">
                    <MarkdownRenderer
                      content={note.content ? note.content.substring(0, 280) + '...' : 'No content available'}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="text-xs text-gray-500">
                      Updated: {formatDate(note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt)}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFullNote(note.id);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        View Note
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
          );
        })()}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Note
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelDeleteNote}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteNote}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
