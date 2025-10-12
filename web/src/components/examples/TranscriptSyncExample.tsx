'use client';

import React from 'react';
import { useAudioPlayer } from '@/lib/hooks/use-audio-player';
import { useTranscriptSync } from '@/lib/hooks/use-transcript-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

interface TranscriptSyncExampleProps {
  audioUrl: string;
  transcript: string;
  title?: string;
}

/**
 * Example component demonstrating transcript synchronization with audio playback
 */
export function TranscriptSyncExample({ 
  audioUrl, 
  transcript, 
  title = 'Podcast Episode' 
}: TranscriptSyncExampleProps) {
  // Audio player hook
  const { state: audioState, controls: audioControls } = useAudioPlayer(audioUrl, {
    onTimeUpdate: (currentTime) => {
      // Update transcript sync with current audio time
      transcriptSync.updateCurrentTime(currentTime);
    },
  });

  // Transcript synchronization hook
  const transcriptSync = useTranscriptSync({
    transcript,
    audioDuration: audioState.duration,
    syncMode: 'simulated',
    autoEnhance: true,
    enableTopicExtraction: true,
  });

  const handleJumpToTopic = (topicIndex: number) => {
    const timestamp = transcriptSync.jumpToTopic(topicIndex);
    if (timestamp !== null) {
      audioControls.seek(timestamp);
    }
  };

  const handleSyncModeToggle = () => {
    const newMode = transcriptSync.syncState.syncMode === 'realtime' ? 'simulated' : 'realtime';
    transcriptSync.setSyncMode(newMode);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <div className="flex items-center gap-2">
              <Badge variant={transcriptSync.syncState.syncMode === 'realtime' ? 'default' : 'secondary'}>
                {transcriptSync.syncState.syncMode}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncModeToggle}
                disabled={transcriptSync.isProcessing}
              >
                <Settings className="w-4 h-4 mr-2" />
                Toggle Mode
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Audio Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={audioControls.toggle}
              disabled={!audioState.isReady}
              size="lg"
            >
              {audioState.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={audioControls.restart}
              disabled={!audioState.isReady}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">
                {Math.floor(audioState.currentTime / 60)}:{String(Math.floor(audioState.currentTime % 60)).padStart(2, '0')} / {Math.floor(audioState.duration / 60)}:{String(Math.floor(audioState.duration % 60)).padStart(2, '0')}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${audioState.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {audioState.error && (
            <div className="text-red-600 text-sm">
              Error: {audioState.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topics Navigation */}
      {transcriptSync.topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {transcriptSync.topics.map((topic, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleJumpToTopic(index)}
                  className="text-left"
                >
                  {topic.topic}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {Math.floor(topic.timestamp / 60)}:{String(Math.floor(topic.timestamp % 60)).padStart(2, '0')}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Transcript
            <div className="flex items-center gap-2">
              {transcriptSync.isProcessing && (
                <Badge variant="secondary">Processing...</Badge>
              )}
              <Badge variant="outline">
                {Math.round(transcriptSync.progress)}% Complete
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transcriptSync.error ? (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">
              <p className="font-medium">Error processing transcript:</p>
              <p className="text-sm mt-1">{transcriptSync.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={transcriptSync.reprocessTranscript}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div 
                className="leading-relaxed text-base"
                dangerouslySetInnerHTML={{ 
                  __html: transcriptSync.highlightedText || transcript 
                }}
              />
            </div>
          )}

          {transcriptSync.activeChunk && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Currently reading: <span className="font-medium">{transcriptSync.activeChunk.text}</span>
                {transcriptSync.activeChunk.speaker && (
                  <Badge variant="secondary" className="ml-2">
                    {transcriptSync.activeChunk.speaker}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Sync Mode</div>
              <div className="text-muted-foreground">{transcriptSync.syncState.syncMode}</div>
            </div>
            <div>
              <div className="font-medium">Chunks</div>
              <div className="text-muted-foreground">{transcriptSync.syncData?.chunks.length || 0}</div>
            </div>
            <div>
              <div className="font-medium">Topics</div>
              <div className="text-muted-foreground">{transcriptSync.topics.length}</div>
            </div>
            <div>
              <div className="font-medium">Progress</div>
              <div className="text-muted-foreground">{Math.round(transcriptSync.progress)}%</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={transcriptSync.reprocessTranscript}
              disabled={transcriptSync.isProcessing}
            >
              Reprocess
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={transcriptSync.enhanceTranscript}
              disabled={transcriptSync.isProcessing}
            >
              Enhance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TranscriptSyncExample;