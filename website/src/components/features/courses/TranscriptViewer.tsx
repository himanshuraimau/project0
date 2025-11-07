"use client";

import React, { useState, useEffect } from 'react';
import { FileSearch, Download, Copy, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TranscriptViewerProps {
  chapterId: string;
  videoId: string | null;
  chapterName: string;
}

interface TranscriptSegment {
  id: number;
  text: string;
  startTime: string;
  startMs: number;
  endMs: number;
}

interface TranscriptData {
  videoId: string;
  chapterName: string;
  transcript: string;
  segments: TranscriptSegment[];
  totalSegments: number;
}

export default function TranscriptViewer({ chapterId, videoId, chapterName }: TranscriptViewerProps) {
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSegments, setFilteredSegments] = useState<TranscriptSegment[]>([]);

  useEffect(() => {
    if (chapterId && videoId) {
      fetchTranscript();
    }
  }, [chapterId, videoId]);

  useEffect(() => {
    if (transcriptData) {
      if (searchQuery.trim()) {
        const filtered = transcriptData.segments.filter(segment =>
          segment.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredSegments(filtered);
      } else {
        setFilteredSegments(transcriptData.segments);
      }
    }
  }, [searchQuery, transcriptData]);

  const fetchTranscript = async () => {
    if (!chapterId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chapter/${chapterId}/transcript`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      if (data.success && data.data) {
        setTranscriptData(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError(err instanceof Error ? err.message : "Failed to load transcript");
    } finally {
      setLoading(false);
    }
  };

  const copyTranscript = () => {
    if (transcriptData) {
      navigator.clipboard.writeText(transcriptData.transcript);
      // You could add a toast notification here
    }
  };

  const downloadTranscript = () => {
    if (!transcriptData) return;
    
    const formattedText = transcriptData.segments.map(segment => 
      `[${segment.startTime}] ${segment.text}`
    ).join('\n\n');
    
    const blob = new Blob([formattedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chapterName}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!videoId) {
    return (
      <div className="text-center p-8">
        <FileSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Video Available</h3>
        <p className="text-muted-foreground">
          A video must be loaded before the transcript can be displayed.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Loading Transcript</h3>
        <p className="text-muted-foreground text-center">
          Fetching video transcript and processing content...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <FileSearch className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Transcript</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchTranscript} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!transcriptData || transcriptData.segments.length === 0) {
    return (
      <div className="text-center p-8">
        <FileSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Transcript Available</h3>
        <p className="text-muted-foreground mb-4">
          The transcript for this video is not available or could not be processed.
        </p>
        <Button onClick={fetchTranscript} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Video Transcript</h3>
          <p className="text-sm text-muted-foreground">
            {transcriptData.totalSegments} segments • {transcriptData.videoId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={copyTranscript} variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button onClick={downloadTranscript} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Transcript content */}
      <div className="h-fit space-y-2 border rounded-lg p-4">
        {filteredSegments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No transcript segments match your search.' : 'No transcript content available.'}
          </div>
        ) : (
          filteredSegments.map((segment) => (
            <div key={segment.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="text-xs text-muted-foreground font-mono min-w-[50px] mt-1">
                {segment.startTime}
              </div>
              <div className="flex-1 text-sm leading-relaxed">
                {searchQuery ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: segment.text.replace(
                        new RegExp(`(${searchQuery})`, 'gi'),
                        '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
                      )
                    }}
                  />
                ) : (
                  segment.text
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="text-xs text-muted-foreground text-center">
        Showing {filteredSegments.length} of {transcriptData.totalSegments} segments
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
    </div>
  );
}