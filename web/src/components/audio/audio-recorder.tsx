'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Upload, Loader2, Play, Square } from 'lucide-react';
import { checkCreditsAndRedirect } from '@/lib/client/credits-api';

interface AudioRecorderProps {
  onTranscriptionComplete: (result: {
    transcript: { id: string; content: string };
    note: { 
      id?: string; 
      title?: string; 
      content?: string;
      error?: string;
      message?: string;
      insufficientCredits?: boolean;
      redirectToPricing?: boolean;
      redirectUrl?: string;
    };
  }) => void;
}

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // We don't need to check credits on mount since the parent component already checks

  const startRecording = async () => {
    // Credits are already checked by the parent component before opening the dialog
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please ensure microphone access is granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Credits are already checked by the parent component before opening the dialog
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

    // Check credits before processing
    const hasCredits = await checkCreditsAndRedirect();
    if (!hasCredits) {
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('fileName', fileName || 'recorded-audio');

      const response = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Handle case where transcript was created but note creation failed due to insufficient credits
        if (result.note?.insufficientCredits && result.note?.redirectToPricing) {
          // Pass the result to the callback so the parent can handle the redirect
          onTranscriptionComplete(result);
          
          // Optionally, also redirect automatically after a delay
          if (typeof window !== 'undefined' && result.note.redirectUrl) {
            setTimeout(() => {
              window.location.href = result.note.redirectUrl || '/pricing';
            }, 3000); // Give the user a moment to see the result before redirecting
          }
          
          alert('Transcript created, but note generation requires more credits. Redirecting to pricing page...');
        } else {
          onTranscriptionComplete(result);
        }
        
        // Reset form
        setAudioBlob(null);
        setFileName('');
        setIsPlaying(false);
      } else {
        const error = await response.json();
        
        // Handle insufficient credits error specifically
        if (error.redirectToPricing) {
          alert('Insufficient credits. You will be redirected to the pricing page.');
          if (typeof window !== 'undefined' && error.redirectUrl) {
            setTimeout(() => {
              window.location.href = error.redirectUrl || '/pricing';
            }, 1500);
          }
        } else {
          throw new Error(error.error || 'Failed to transcribe audio');
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Audio Transcription
        </CardTitle>
        <CardDescription>
          Record audio or upload an audio file to generate transcripts and summaries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div>
          <label htmlFor="audio-upload" className="block text-sm font-medium mb-2">
            Upload Audio File
          </label>
          <Input
            id="audio-upload"
            type="file"
            accept=".wav,.mp3,.aiff,.aac,.ogg,.flac"
            onChange={handleFileUpload}
            className="cursor-pointer"
          />
        </div>

        {/* OR Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-sm text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Recording Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="flex-1">
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="flex-1">
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            )}
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
        </div>
      </CardContent>
    </Card>
  );
}
