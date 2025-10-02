"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Loader2, Play, Square } from "lucide-react";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";

interface RecordAudioProps {
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
  onClose?: () => void;
}

export default function RecordAudio({
  onTranscriptionComplete,
  onClose,
}: RecordAudioProps) {
  const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "Failed to start recording. Please ensure microphone access is granted and try again."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
    
    // Add loading note immediately when processing starts
    const tempId = `audio-record-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "audio");

    // Close modal immediately after starting
    if (onClose) {
      onClose();
    }

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("fileName", fileName || "recorded-audio");

      const response = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Call completion with result that includes temp ID for tracking
        onTranscriptionComplete({
          ...result,
          transcript: {
            ...result.transcript,
            id: result.transcript.id || tempId
          }
        });

        // Reset form
        setAudioBlob(null);
        setFileName("");
        setIsPlaying(false);
      } else {
        // Remove loading note on error
        if (currentTempId) {
          removeLoadingNote(currentTempId);
        }

        const error = await response.json();
        throw new Error(error.error || "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      
      // Remove loading note on error
      if (currentTempId) {
        removeLoadingNote(currentTempId);
      }
      
      alert(
        "Failed to transcribe audio. Please try again. Error: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <Mic className="h-8 w-8 text-accent-foreground" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground">Record Audio</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Record audio to generate transcripts and summaries
            </p>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            {/* Recording Controls */}
            <div className="flex gap-2">
              {!isRecording ? (
                <Button 
                  onClick={startRecording} 
                  className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-1 h-12 rounded-xl font-semibold shadow-lg"
                >
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>

            {/* Audio Preview */}
            {audioBlob && (
              <div className="space-y-4 p-6 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex gap-3">
                  {!isPlaying ? (
                    <Button 
                      onClick={playAudio} 
                      variant="outline" 
                      size="sm"
                      className="rounded-xl"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopAudio} 
                      variant="outline" 
                      size="sm"
                      className="rounded-xl"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="fileName"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    File Name (Optional)
                  </label>
                  <Input
                    id="fileName"
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter a name for this audio"
                    className="h-10 rounded-xl border-2 border-border/20 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent/50 transition-colors"
                  />
                </div>

                <Button
                  onClick={transcribeAudio}
                  disabled={isProcessing}
                  className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Transcribe & Generate Summary
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
