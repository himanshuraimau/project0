import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trash2,
  AlertTriangle,
  Plus,
  ChevronDown,
  Calendar,
  FileText,
  Eye,
  Loader2,
} from "lucide-react";

import { MarkdownRenderer } from "@/components/mdx-renderer";
import { NotesViewerProps } from "@/lib/types";

export function NotesViewer({ transcriptId, searchQuery }: NotesViewerProps) {
  const router = useRouter();
  const {
    getNotes,
    generateNotesFromTranscript,
    generateFocusedNotes,
    deleteNote,
    loading,
    error,
  } = useNotes();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteTypeOptions, setShowNoteTypeOptions] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadNotes = useCallback(async () => {
    const result = await getNotes(transcriptId);
    if (result) {
      setNotes(result);
    }
  }, [transcriptId, getNotes]);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleGenerateNotes = async () => {
    if (!transcriptId) return;

    const result = await generateNotesFromTranscript(transcriptId);
    if (result) {
      await loadNotes();
    }
  };

  const handleGenerateFocusedNotes = async (
    noteType:
      | "summary"
      | "detailed"
      | "action-items"
      | "technical"
      | "executive"
  ) => {
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
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteNote = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  const handleViewFullNote = (noteId: string) => {
    router.push(`/notes/${noteId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter notes based on search query
  const filterNotes = (notes: Note[], query: string): Note[] => {
    if (!query || query.trim() === "") {
      return notes;
    }

    const searchTerm = query.toLowerCase().trim();

    return notes.filter((note) => {
      // Search in note title
      const titleMatch = note.title.toLowerCase().includes(searchTerm);

      // Search in note content
      const contentMatch =
        note.content?.toLowerCase().includes(searchTerm) || false;

      // Search in transcript original name
      const transcriptMatch =
        note.transcript?.originalName.toLowerCase().includes(searchTerm) ||
        false;

      return titleMatch || contentMatch || transcriptMatch;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Loading notes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Error loading notes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <Button onClick={loadNotes} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="w-full">
      {transcriptId && (
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <Button
            onClick={handleGenerateNotes}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Generate Standard Notes
          </Button>

          <div className="relative">
            <Button
              onClick={() => setShowNoteTypeOptions(!showNoteTypeOptions)}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
            >
              <FileText className="h-4 w-4" />
              Generate Focused Notes
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showNoteTypeOptions ? "rotate-180" : ""
                }`}
              />
            </Button>

            {showNoteTypeOptions && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 overflow-hidden">
                {[
                  {
                    type: "summary" as const,
                    label: "Summary",
                    desc: "Key points overview",
                    color:
                      "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
                  },
                  {
                    type: "detailed" as const,
                    label: "Detailed Notes",
                    desc: "Comprehensive breakdown",
                    color:
                      "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
                  },
                  {
                    type: "action-items" as const,
                    label: "Action Items",
                    desc: "Tasks and next steps",
                    color:
                      "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
                  },
                  {
                    type: "technical" as const,
                    label: "Technical Focus",
                    desc: "Technical details",
                    color:
                      "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
                  },
                  {
                    type: "executive" as const,
                    label: "Executive Brief",
                    desc: "Decision-maker summary",
                    color:
                      "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                  },
                ].map(({ type, label, desc, color }) => (
                  <button
                    key={type}
                    onClick={() => handleGenerateFocusedNotes(type)}
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                    disabled={loading}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 ${
                          color.split(" ")[0]
                        } ${color.split(" ")[1]}`}
                      ></div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {desc}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {(() => {
          const filteredNotes = filterNotes(notes, searchQuery || "");

          if (notes.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  No notes found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first note to get started
                </p>
                {transcriptId && (
                  <Button
                    onClick={handleGenerateNotes}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate AI Notes
                  </Button>
                )}
              </div>
            );
          }

          if (filteredNotes.length === 0 && searchQuery) {
            return (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  No notes match your search
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {searchQuery && (
                <div className="flex items-center justify-between mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Showing {filteredNotes.length} of {notes.length} notes
                  </div>
                </div>
              )}

              {filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className="group hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  onClick={() => handleViewFullNote(note.id)}
                >
                  <CardContent className="">
                    <div className="mb-4">
                      <div className="text-gray-800 dark:text-gray-200 line-clamp-4">
                        <MarkdownRenderer
                          content={
                            note.content
                              ? note.content.substring(0, 280) + "..."
                              : "No content available"
                          }
                          className="text-sm leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(
                            note.updatedAt instanceof Date
                              ? note.updatedAt.toISOString()
                              : note.updatedAt
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFullNote(note.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs bg-white cursor-pointer dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Note
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this note? This action cannot be
              undone and all content will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={cancelDeleteNote}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteNote}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
