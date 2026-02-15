"use client";

import { useEffect, useRef, useState } from "react";
import type { NoteProgressEvent } from "@/lib/note-progress-manager";
import { subscribeToPusherProgress, cleanupPusherJob } from "@/lib/realtime/pusher-client";

interface UsePusherProgressOptions {
  jobId: string;
  enabled?: boolean;
  onProgress?: (event: NoteProgressEvent) => void;
  onCompleted?: (event: NoteProgressEvent) => void;
  onError?: (event: NoteProgressEvent) => void;
}

export function usePusherProgress({
  jobId,
  enabled = true,
  onProgress,
  onCompleted,
  onError,
}: UsePusherProgressOptions) {
  const [latestEvent, setLatestEvent] = useState<NoteProgressEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef({ onProgress, onCompleted, onError });

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onProgress, onCompleted, onError };
  }, [onProgress, onCompleted, onError]);

  useEffect(() => {
    if (!enabled || !jobId) {
      setIsConnected(false);
      return;
    }

    console.log("[Pusher] Setting up subscription for:", jobId);
    setIsConnected(true);

    // Use global subscription that persists across navigation
    const unsubscribe = subscribeToPusherProgress(jobId, (event: NoteProgressEvent) => {
      setLatestEvent(event);

      const { onProgress, onCompleted, onError } = callbacksRef.current;

      if (event.stage === "completed" && onCompleted) {
        console.log(`[Pusher] Note ${jobId} completed, calling onCompleted`);
        onCompleted(event);
        // Cleanup the global subscription since note is done
        cleanupPusherJob(jobId);
      } else if (event.stage === "error" && onError) {
        console.log(`[Pusher] Note ${jobId} errored`);
        onError(event);
        // Cleanup on error too
        cleanupPusherJob(jobId);
      } else if (onProgress) {
        onProgress(event);
      }
    });

    return () => {
      // Only remove this component's callback, don't kill the subscription
      // This allows other components or future mounts to still receive events
      console.log("[Pusher] Component unmounting, but keeping subscription alive for:", jobId);
      unsubscribe();
      setIsConnected(false);
    };
  }, [jobId, enabled]);

  return {
    latestEvent,
    isConnected,
    progress: latestEvent?.progress ?? 0,
    stage: latestEvent?.stage,
    message: latestEvent?.message,
  };
}
