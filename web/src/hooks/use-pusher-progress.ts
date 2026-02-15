"use client";

import { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import type { NoteProgressEvent } from "@/lib/note-progress-manager";

const globalForPusher = globalThis as typeof globalThis & {
  __pusherClient?: Pusher;
};

function getPusherClient() {
  if (!globalForPusher.__pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

    if (!key) {
      console.error("[Pusher] ❌ Missing NEXT_PUBLIC_PUSHER_KEY - Real-time updates disabled");
      console.error("[Pusher] 💡 Make sure NEXT_PUBLIC_PUSHER_KEY is set in .env and restart the dev server");
      return null;
    }

    console.log("[Pusher] ✓ Initializing Pusher client with cluster:", cluster);
    globalForPusher.__pusherClient = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
    
    // Log connection state changes
    globalForPusher.__pusherClient.connection.bind('state_change', (states: any) => {
      console.log(`[Pusher] Connection state: ${states.previous} → ${states.current}`);
    });
  }

  return globalForPusher.__pusherClient;
}

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
      return;
    }

    const pusher = getPusherClient();
    if (!pusher) {
      console.warn("[Pusher] Client not available, progress updates disabled");
      return;
    }

    const channelName = "note-progress";
    const eventName = `note-${jobId}`;

    console.log("[Pusher] Subscribing to:", channelName, eventName);

    const channel = pusher.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("[Pusher] Subscription succeeded:", channelName);
      setIsConnected(true);
    });

    channel.bind("pusher:subscription_error", (error: unknown) => {
      console.error("[Pusher] Subscription error:", error);
      setIsConnected(false);
    });

    channel.bind(eventName, (event: NoteProgressEvent) => {
      console.log("[Pusher] Progress update:", event);
      setLatestEvent(event);

      const { onProgress, onCompleted, onError } = callbacksRef.current;

      if (event.stage === "completed" && onCompleted) {
        onCompleted(event);
      } else if (event.stage === "error" && onError) {
        onError(event);
      } else if (onProgress) {
        onProgress(event);
      }
    });

    return () => {
      console.log("[Pusher] Unsubscribing from:", channelName, eventName);
      channel.unbind_all();
      pusher.unsubscribe(channelName);
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
