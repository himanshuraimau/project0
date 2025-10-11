'use client';

import React, { useState, useEffect } from 'react';
import { TranscriptViewer } from '@/components/podcast/transcript-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

/**
 * Demo component to showcase the TranscriptViewer functionality
 */
export function TranscriptViewerDemo() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration] = useState(120); // 2 minutes demo

  // Sample transcript for demonstration
  const sampleTranscript = `
    Welcome to this podcast episode about artificial intelligence and machine learning. 
    Today we'll be discussing the latest developments in natural language processing and how AI is transforming various industries.
    
    First, let's talk about the evolution of language models. Over the past few years, we've seen remarkable progress in this field.
    From simple rule-based systems to sophisticated neural networks, the journey has been fascinating.
    
    The impact of these technologies extends far beyond just text generation. We're seeing applications in healthcare, education, finance, and many other sectors.
    Each industry is finding unique ways to leverage these powerful tools to solve complex problems.
    
    Looking ahead, the future of AI seems incredibly promising. With continued research and development, we can expect even more breakthrough innovations.
    The key is to ensure that these technologies are developed responsibly and ethically.
    
    Thank you for listening to today's episode. We hope you found this discussion informative and engaging.
  `;

  // Simulate audio playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= audioDuration) {
            setIsPlaying(false);
            return audioDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, audioDuration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TranscriptViewer Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={handlePlayPause} size="lg">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button onClick={handleRestart} variant="outline">
              Restart
            </Button>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">
                {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')} / {Math.floor(audioDuration / 60)}:{String(audioDuration % 60).padStart(2, '0')}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentTime / audioDuration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full TranscriptViewer */}
        <TranscriptViewer
          transcript={sampleTranscript}
          currentTime={currentTime}
          audioDuration={audioDuration}
          onTimeSeek={handleSeek}
          showTopics={true}
          autoEnhance={false}
        />

        {/* Compact TranscriptViewer */}
        <TranscriptViewer
          transcript={sampleTranscript}
          currentTime={currentTime}
          audioDuration={audioDuration}
          onTimeSeek={handleSeek}
          compact={true}
          showTopics={false}
        />
      </div>
    </div>
  );
}

export default TranscriptViewerDemo;