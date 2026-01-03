'use client';

import React, { useState, useEffect } from 'react';
import { PodcastHeader } from './PodcastHeader';
import { PodcastTabs } from './PodcastTabs';
import { PodcastSectionsList } from './PodcastSectionsList';
import { PodcastPlayer } from './PodcastPlayer';
import { PodcastTranscript } from './PodcastTranscript';
import { PodcastPageProps, PodcastData, PodcastSection } from './types';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { usePodcastGeneration } from '@/hooks/usePodcastGeneration';

export function PodcastPage({ noteId, noteTitle = 'Untitled Note', noteContent }: PodcastPageProps) {
  const [activeTab, setActiveTab] = useState<'sections' | 'transcript'>('sections');
  const [podcast, setPodcast] = useState<PodcastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { job, isGenerating, generate, reset } = usePodcastGeneration();

  // Fetch existing podcast data
  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/podcast/note/${noteId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch podcast');
        }

        const data = await response.json();
        
        if (data.success && data.podcasts && data.podcasts.length > 0) {
          // Get the most recent completed podcast
          const completedPodcast = data.podcasts.find(
            (p: any) => p.status === 'COMPLETED' && p.audioUrl
          );
          
          if (completedPodcast) {
            setPodcast({
              id: completedPodcast.id,
              noteId: completedPodcast.noteId,
              title: completedPodcast.title || noteTitle,
              description: completedPodcast.description,
              audioUrl: completedPodcast.audioUrl,
              duration: completedPodcast.duration || 0,
              transcript: completedPodcast.transcript,
              sections: parseSections(completedPodcast.transcript),
              status: completedPodcast.status,
              createdAt: new Date(completedPodcast.createdAt),
            });
          }
        }
      } catch (err: any) {
        console.error('Error fetching podcast:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPodcast();
  }, [noteId, noteTitle]);

  // Update podcast when generation completes
  useEffect(() => {
    if (job?.status === 'completed' && job.audioUrl) {
      setPodcast({
        id: job.jobId || '',
        noteId,
        title: noteTitle,
        audioUrl: job.audioUrl,
        duration: job.audioDuration || 0,
        transcript: job.transcript,
        sections: parseSections(job.transcript),
        status: 'COMPLETED',
        createdAt: new Date(),
      });
    }
  }, [job, noteId, noteTitle]);

  const parseSections = (transcript: any): PodcastSection[] => {
    if (!transcript || !Array.isArray(transcript)) return [];

    // Group transcript into sections (simple implementation)
    // You can enhance this based on your actual data structure
    const sections: PodcastSection[] = [];
    let currentSection: PodcastSection = {
      title: '',
      timestamp: '0:00',
      description: '',
    };
    let sectionTexts: string[] = [];

    transcript.forEach((item: any, index: number) => {
      const text = item.text || '';
      
      // Start a new section every 3-4 exchanges or on topic change
      if (index % 6 === 0 || index === 0) {
        if (currentSection.title && sectionTexts.length > 0) {
          currentSection.description = sectionTexts.join(' ').slice(0, 150) + '...';
          sections.push(currentSection);
          sectionTexts = [];
        }
        
        currentSection = {
          title: extractSectionTitle(text, sections.length),
          timestamp: formatTimestamp(index * 10), // Approximate timestamp
          description: '',
        };
      }
      
      sectionTexts.push(text);
    });

    // Add the last section
    if (currentSection.title && sectionTexts.length > 0) {
      currentSection.description = sectionTexts.join(' ').slice(0, 150) + '...';
      sections.push(currentSection);
    }

    return sections;
  };

  const extractSectionTitle = (text: string, index: number): string => {
    // Extract first sentence or meaningful phrase
    const sentences = text.split(/[.!?]/);
    if (sentences.length > 0 && sentences[0].length > 0) {
      return sentences[0].slice(0, 60) + (sentences[0].length > 60 ? '...' : '');
    }
    return `Section ${index + 1}`;
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerate = async (duration: 'short' | 'long') => {
    if (!noteContent) {
      setError('Note content is empty. Cannot generate podcast.');
      return;
    }
    
    try {
      setError(null);
      await generate(noteId, noteContent, duration);
    } catch (err: any) {
      setError(err.message || 'Failed to generate podcast');
    }
  };

  const handleAskQuestion = async (question: string) => {
    // Implement AI question handling
    console.log('Question asked:', question);
    // You can integrate this with your chat/AI system
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/notes/${noteId}`;
      if (navigator.share) {
        await navigator.share({
          title: `Podcast: ${noteTitle}`,
          text: 'Check out this AI-generated podcast!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownload = async () => {
    if (!podcast?.audioUrl) return;

    try {
      const response = await fetch(podcast.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${noteTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_podcast.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading podcast...</p>
        </div>
      </div>
    );
  }

  // No podcast exists yet - show generation UI
  if (!podcast && !isGenerating && !job) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🎙️</div>
          <h2 className="text-2xl font-semibold">Generate Your Podcast</h2>
          <p className="text-muted-foreground">
            Transform your note into an AI-generated podcast with two speakers discussing the content
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {!noteContent || noteContent.trim().length === 0 ? (
            <p className="text-red-600 dark:text-red-400">
              Note content is empty. Please add content to your note first.
            </p>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => handleGenerate('short')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
                size="lg"
              >
                Generate Short Podcast (3-5 min)
              </Button>
              <Button
                onClick={() => handleGenerate('long')}
                className="bg-purple-700 hover:bg-purple-800 text-white px-8 py-6 text-lg"
                size="lg"
              >
                Generate Long Podcast (8-10 min)
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generating state
  if (isGenerating && job) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-semibold">Generating Your Podcast...</h2>
          <p className="text-muted-foreground">
            This may take 30-120 seconds. Feel free to navigate away.
          </p>
          
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{ width: `${job.progress || 0}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {job.progress}% - {job.currentStep || 'Processing...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (job?.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400">
            Generation Failed
          </h2>
          <p className="text-red-600 dark:text-red-400">
            {job.error || 'An unknown error occurred'}
          </p>
          <Button
            onClick={() => {
              reset();
              handleGenerate('short');
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Main podcast view
  if (!podcast) return null;

  return (
    <div className="w-full bg-white dark:bg-gray-950 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <PodcastHeader
          title={podcast.title}
          noteId={noteId}
          onShare={handleShare}
        />

        <PodcastTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Sections or Transcript */}
          <div className="lg:col-span-1">
            {activeTab === 'sections' ? (
              <PodcastSectionsList
                sections={podcast.sections || []}
                onSectionClick={(timestamp) => console.log('Jump to:', timestamp)}
              />
            ) : (
              <PodcastTranscript
                transcript={podcast.transcript || []}
                title={podcast.title}
              />
            )}
          </div>

          {/* Right Column - Player */}
          <div className="lg:col-span-1">
            <PodcastPlayer
              audioUrl={podcast.audioUrl}
              title={podcast.title}
              duration={podcast.duration}
              speakers={podcast.speakers}
              coverImage={podcast.coverImage}
              onAskQuestion={handleAskQuestion}
              onShare={handleShare}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
