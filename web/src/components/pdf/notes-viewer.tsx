import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes, Note } from '@/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NotesViewerProps {
  transcriptId?: string;
  searchQuery?: string;
}

export function NotesViewer({ transcriptId, searchQuery }: NotesViewerProps) {
  const router = useRouter();
  const { getNotes, generateNotesFromTranscript, generateFocusedNotes, deleteNote, loading, error } = useNotes();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteTypeOptions, setShowNoteTypeOptions] = useState(false);

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

  const handleDeleteNote = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      const success = await deleteNote(id);
      if (success) {
        await loadNotes();
      }
    }
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
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
                
                <div className="text-sm text-gray-700 line-clamp-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-3 [&>h2]:mb-2 [&>h2]:border-b [&>h2]:border-border [&>h2]:pb-1 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-2 [&>h3]:mb-1 [&>p]:mb-2 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>li]:mb-1 [&>div]:mb-2 [&>strong]:text-foreground [&>div]:p-2 [&>div]:bg-muted/30 [&>div]:rounded [&>div]:border [&>div]:border-border [&>em]:italic [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>del]:line-through [&>del]:text-muted-foreground [&>a]:text-primary [&>a]:hover:underline [&>a]:transition-colors" 
                     dangerouslySetInnerHTML={{ __html: formatNoteContent(note.content ? note.content.substring(0, 300) + '...' : 'No content available') }} />
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(note.updatedAt)}
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
          );
        })()}
      </CardContent>
    </Card>
  );
}
