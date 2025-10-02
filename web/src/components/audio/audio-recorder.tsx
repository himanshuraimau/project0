"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, Play, Square } from "lucide-react";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";

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
  onClose?: () => void;
}

export default function AudioRecorder({
  onTranscriptionComplete,
  onClose,
}: AudioRecorderProps) {
  const { addLoadingNote, removeLoadingNote } = useDashboardRefresh();
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
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
    const tempId = `audio-upload-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "audio");

    // Close modal immediately after starting
    if (onClose) {
      onClose();
    }

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("fileName", fileName || "uploaded-audio");

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
      
      alert("Failed to transcribe audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
            <Upload className="h-8 w-8 text-accent-foreground" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground">Upload Audio File</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Upload an audio file to generate transcripts and summaries
            </p>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            <div className="text-left">
              <label
                htmlFor="audio-upload"
                className="block text-sm font-semibold text-foreground mb-3"
              >
                Select Audio File
              </label>
              <Input
                id="audio-upload"
                type="file"
                accept=".wav,.mp3,.aiff,.aac,.ogg,.flac"
                onChange={handleFileUpload}
                className="h-12 rounded-xl border-2 border-border/20 bg-background text-foreground cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 focus:border-accent/50 transition-colors"
              />
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
                      <Upload className="h-5 w-5 mr-2" />
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
