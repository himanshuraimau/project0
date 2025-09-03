'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, Play, Square } from 'lucide-react';


interface AudioRecorderProps {
  onTranscriptionComplete: (result: {
    transcript: { id: string; content: string };
    note: { 
      id?: string; 
      title?: string; 
      content?: string;
      error?: string;
      message?: string;
    };
  }) => void;
}

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setFileName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    }
  };

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('fileName', fileName || 'uploaded-audio');

      const response = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onTranscriptionComplete(result);
        
        // Reset form
        setAudioBlob(null);
        setFileName('');
        setIsPlaying(false);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className='pt-4 rounded-[8px] border border-stone-400'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Audio File
        </CardTitle>
        <CardDescription>
          Upload an audio file to generate transcripts and summaries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 mt-4 px-5">
        {/* File Upload */}
        <div>
          <label htmlFor="audio-upload" className=" block text-sm font-semibold mb-2">
            Select Audio File
          </label>
          <Input
            id="audio-upload"
            type="file"
            accept=".wav,.mp3,.aiff,.aac,.ogg,.flac"
            onChange={handleFileUpload}
            className="cursor-pointer rounded-[8px]"
          />
        </div>

        {/* Audio Preview */}
        {audioBlob && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {!isPlaying ? (
                <Button onClick={playAudio} variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </Button>
              ) : (
                <Button onClick={stopAudio} variant="outline" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>

            <div>
              <label htmlFor="fileName" className="block text-sm font-medium mb-2">
                File Name (Optional)
              </label>
              <Input
                id="fileName"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter a name for this audio"
              />
            </div>

            <Button 
              onClick={transcribeAudio} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Transcribe & Generate Summary
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
