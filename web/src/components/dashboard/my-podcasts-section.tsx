"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Trash2, RefreshCw, Headphones } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Podcast {
  id: string;
  title: string;
  description: string;
  durationPreset: string;
  estimatedDuration: number;
  actualDuration?: number;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
  generationError?: string;
  createdAt: string;
  audioUrl?: string;
  noteId: string;
}

interface Note {
  id: string;
  title: string;
}

export function MyPodcastsSection() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);

      // First fetch all notes to get note titles
      const notesResponse = await fetch('/api/notes');
      const notesData = await notesResponse.json();

      if (notesData.success && notesData.data) {
        const notesMap: Record<string, Note> = {};
        notesData.data.forEach((note: Note) => {
          notesMap[note.id] = note;
        });
        setNotes(notesMap);

        // Then fetch podcasts for each note
        const podcastPromises = notesData.data.map(async (note: Note) => {
          try {
            const podcastResponse = await fetch(`/api/notes/${note.id}/podcast`);
            const podcastData = await podcastResponse.json();

            if (podcastData.success && podcastData.data) {
              return { ...podcastData.data, noteId: note.id };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching podcast for note ${note.id}:`, error);
            return null;
          }
        });

        const podcastResults = await Promise.all(podcastPromises);
        const validPodcasts = podcastResults.filter(Boolean) as Podcast[];

        setPodcasts(validPodcasts);
      }
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      toast.error('Failed to load podcasts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePodcast = async (podcastId: string, noteId: string) => {
    if (!confirm('Are you sure you want to delete this podcast?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}/podcast`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setPodcasts(prev => prev.filter(p => p.id !== podcastId));
        toast.success('Podcast deleted successfully');
      } else {
        throw new Error(data.error || 'Failed to delete podcast');
      }
    } catch (error) {
      console.error('Error deleting podcast:', error);
      toast.error('Failed to delete podcast');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'generating':
        return <Badge variant="default" className="bg-blue-500">Generating</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Headphones className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">My Podcasts</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headphones className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">My Podcasts</h2>
          <span className="text-sm text-gray-500">({podcasts.length})</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPodcasts}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {podcasts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Headphones className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No podcasts yet
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Create a podcast from one of your notes to see it here.
            </p>
            <Link href="/dashboard">
              <Button>
                Browse Notes
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {podcast.title || 'Untitled Podcast'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      From: {notes[podcast.noteId]?.title || 'Unknown Note'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(podcast.generationStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {podcast.actualDuration
                        ? formatDuration(podcast.actualDuration)
                        : podcast.estimatedDuration
                        ? formatDuration(podcast.estimatedDuration)
                        : 'Unknown'}
                    </div>
                  </div>

                  {podcast.generationStatus === 'failed' && podcast.generationError && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      Error: {podcast.generationError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {podcast.generationStatus === 'completed' && podcast.audioUrl && (
                      <Button size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Button>
                    )}

                    {podcast.generationStatus === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          // TODO: Implement retry functionality
                          toast.info('Retry functionality coming soon');
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePodcast(podcast.id, podcast.noteId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
