"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotes, Note } from '@/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard';
import { ArrowLeft, Copy, Download, Edit, Share } from 'lucide-react';

export default function NoteViewPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const { getNote, loading, error } = useNotes();
  const [note, setNote] = useState<Note | null>(null);

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

        {/* Note Content */}
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
      </div>
    </DashboardLayout>
  );
}
