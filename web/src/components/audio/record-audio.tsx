"use client";

import { useState, useRef, useEffect } from "react";
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
  const [recordingTime, setRecordingTime] = useState(0);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'checking' | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  // Check microphone permission on component mount
  useEffect(() => {
    const checkInitialPermission = async () => {
      setMicrophonePermission('checking');
      const permissionState = await checkMicrophonePermission();
      
      // Only set to denied if explicitly denied, otherwise set to prompt
      if (permissionState === 'denied') {
        setMicrophonePermission('denied');
      } else if (permissionState === 'granted') {
        setMicrophonePermission('granted');
      } else {
        // For 'prompt', 'unavailable', or any other state, assume we can try
        setMicrophonePermission('prompt');
      }
    };
    
    checkInitialPermission();
  }, []);

  const retryPermissions = async () => {
    setMicrophonePermission('checking');
    const permissionState = await checkMicrophonePermission();
    
    // Only set to denied if explicitly denied, otherwise set to prompt
    if (permissionState === 'denied') {
      setMicrophonePermission('denied');
    } else if (permissionState === 'granted') {
      setMicrophonePermission('granted');
    } else {
      // For 'prompt', 'unavailable', or any other state, assume we can try
      setMicrophonePermission('prompt');
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      // Check if permissions API is available
      if (!navigator.permissions) {
        return 'unavailable';
      }
      
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state;
    } catch (error) {
      console.log('Permission API not available or error:', error);
      // If permission API fails, assume we need to prompt
      return 'prompt';
    }
  };

  const startRecording = async () => {
    try {
      // First check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.");
        return;
      }

      // Check current permission state
      const permissionState = await checkMicrophonePermission();
      
      if (permissionState === 'denied') {
        alert("Microphone access is denied. Please enable microphone permissions in your browser settings and reload the page.");
        return;
      }

      // Request microphone access
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
      } catch (permissionError) {
        console.error("Permission error:", permissionError);
        
        if (permissionError instanceof Error) {
          if (permissionError.name === 'NotAllowedError') {
            setMicrophonePermission('denied');
            alert("Microphone access was denied. Please click 'Allow' when prompted, or enable microphone permissions in your browser settings.");
          } else if (permissionError.name === 'NotFoundError') {
            alert("No microphone found. Please ensure a microphone is connected to your device.");
          } else if (permissionError.name === 'NotReadableError') {
            alert("Microphone is being used by another application. Please close other apps using the microphone and try again.");
          } else {
            alert(`Microphone access error: ${permissionError.message}`);
          }
        } else {
          setMicrophonePermission('denied');
          alert("Failed to access microphone. Please check your browser permissions.");
        }
        return;
      }

      // Determine the best supported MIME type for recording
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      }
      
      // Store the MIME type for later use
      mimeTypeRef.current = mimeType;
      console.log("Using MIME type for recording:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // Use the actual MIME type that was used for recording
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current,
        });
        console.log("Created audio blob with type:", mimeTypeRef.current, "size:", audioBlob.size);
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        
        // Clear timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMicrophonePermission('granted'); // Update permission state on successful access
    } catch (error) {
      console.error("Error starting recording:", error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert("Microphone access denied. Please allow microphone access and try again.");
        } else if (error.name === 'NotFoundError') {
          alert("No microphone found. Please ensure a microphone is connected.");
        } else if (error.name === 'NotReadableError') {
          alert("Microphone is busy. Please close other applications using the microphone.");
        } else {
          alert(`Recording error: ${error.message}`);
        }
      } else {
        alert("Failed to start recording. Please ensure microphone access is granted and try again.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
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

    // Check file size before transcription (25MB limit for OpenAI Whisper)
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (audioBlob.size > maxFileSize) {
      alert(`Recording too large! Maximum size is 25MB. Your recording is ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB. Please record a shorter audio clip.`);
      return;
    }

    setIsProcessing(true);
    
    // Add loading note BEFORE closing modal
    const tempId = `audio-record-${Date.now()}`;
    setCurrentTempId(tempId);
    addLoadingNote(tempId, "audio");

    // Longer delay to ensure state update propagates and UI re-renders
    await new Promise(resolve => setTimeout(resolve, 300));

    // Close modal after adding loading note
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
        
        // Remove loading note using temp ID BEFORE calling completion callback
        if (currentTempId) {
          removeLoadingNote(currentTempId);
          setCurrentTempId(null);
        }
        
        // Wait for shimmer removal to propagate before triggering refresh
        await new Promise(resolve => setTimeout(resolve, 200));
        
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
        const errorData = await response.json();
        
        // Handle specific error types
        if (response.status === 413) {
          throw new Error(`Recording too large: ${errorData.error || 'Audio recording exceeds 25MB limit'}`);
        } else if (response.status === 402) {
          throw new Error('Insufficient credits to process audio');
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid audio format');
        } else {
          throw new Error(errorData.error || "Failed to transcribe audio");
        }
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert(
        "Failed to transcribe audio. Please try again. Error: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      // Always remove loading note in finally block
      if (currentTempId) {
        removeLoadingNote(currentTempId);
        setCurrentTempId(null);
      }
      setIsProcessing(false);
    }
  };

  // Helper function to format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              Record audio to generate transcripts and summaries (25MB limit)
            </p>
            {isRecording && (
              <div className="text-lg font-mono text-red-600 dark:text-red-400">
                Recording: {formatTime(recordingTime)}
              </div>
            )}
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            {/* Microphone Permission Status */}
            {microphonePermission && (
              <div className="text-center text-sm">
                {microphonePermission === 'checking' && (
                  <div className="text-muted-foreground">
                    Checking microphone permissions...
                  </div>
                )}
                {microphonePermission === 'denied' && (
                  <div className="text-red-600 dark:text-red-400 font-medium">
                    Microphone access denied. Please enable in browser settings and reload the page.
                    <br />
                    <span className="text-xs text-muted-foreground">
                      Look for the microphone icon in your browser's address bar.
                    </span>
                    <br />
                    <Button 
                      onClick={retryPermissions}
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                    >
                      Check Permissions Again
                    </Button>
                  </div>
                )}
                {microphonePermission === 'prompt' && (
                  <div className="text-amber-600 dark:text-amber-400 font-medium">
                    Click "Start Recording" and allow microphone access when prompted.
                  </div>
                )}
                {microphonePermission === 'granted' && !isRecording && (
                  <div className="text-green-600 dark:text-green-400 font-medium">
                    Microphone access granted. Ready to record!
                  </div>
                )}
              </div>
            )}
            
            {/* Recording Controls */}
            <div className="flex gap-2">
              {!isRecording ? (
                <Button 
                  onClick={startRecording} 
                  disabled={microphonePermission === 'denied' || microphonePermission === 'checking'}
                  className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  {microphonePermission === 'checking' ? 'Checking Permissions...' : 'Start Recording'}
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
                <div className="text-sm text-muted-foreground text-center">
                  Recording size: {(audioBlob.size / 1024 / 1024).toFixed(2)}MB 
                  {audioBlob.size > 20 * 1024 * 1024 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium"> (approaching 25MB limit)</span>
                  )}
                  {audioBlob.size > 25 * 1024 * 1024 && (
                    <span className="text-red-600 dark:text-red-400 font-medium"> (exceeds 25MB limit!)</span>
                  )}
                </div>
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
