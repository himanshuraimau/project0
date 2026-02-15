"use client";

import Pusher from "pusher-js";
import type { NoteProgressEvent } from "@/lib/note-progress-manager";

const globalForPusher = globalThis as typeof globalThis & {
  __pusherClient?: Pusher;
  __pusherSubscriptions?: Map<string, Set<(event: NoteProgressEvent) => void>>;
  __pusherEventHandlers?: Map<string, (event: NoteProgressEvent) => void>;
  __pusherLastEvents?: Map<string, NoteProgressEvent>;
};

let pusherClient: Pusher | null = null;
const subscriptions = globalForPusher.__pusherSubscriptions || new Map<string, Set<(event: NoteProgressEvent) => void>>();
globalForPusher.__pusherSubscriptions = subscriptions;

// Store event handlers globally so we only bind once per event
const eventHandlers = globalForPusher.__pusherEventHandlers || new Map<string, (event: NoteProgressEvent) => void>();
globalForPusher.__pusherEventHandlers = eventHandlers;

// Store last event per job so we can replay missed events
const lastEvents = globalForPusher.__pusherLastEvents || new Map<string, NoteProgressEvent>();
globalForPusher.__pusherLastEvents = lastEvents;

export function getPusherClient() {
  if (!pusherClient && !globalForPusher.__pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

    if (!key) {
      console.error("[Pusher] ❌ Missing NEXT_PUBLIC_PUSHER_KEY - Real-time updates disabled");
      console.error("[Pusher] 💡 Make sure NEXT_PUBLIC_PUSHER_KEY is set in .env and restart the dev server");
      return null;
    }

    console.log("[Pusher] ✓ Initializing Pusher client with cluster:", cluster);
    pusherClient = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
    
    globalForPusher.__pusherClient = pusherClient;
    
    // Log connection state changes
    pusherClient.connection.bind('state_change', (states: any) => {
      console.log(`[Pusher] Connection state: ${states.previous} → ${states.current}`);
    });
  }

  return pusherClient || globalForPusher.__pusherClient;
}

/**
 * Subscribe to progress updates for a specific job.
 * This subscription persists across component unmounts to avoid missing events.
 */
export function subscribeToPusherProgress(
  jobId: string,
  callback: (event: NoteProgressEvent) => void
): () => void {
  const pusher = getPusherClient();
  if (!pusher) {
    console.warn("[Pusher] Client not available, progress updates disabled");
    return () => {};
  }

  const channelName = "note-progress";
  const eventName = `note-${jobId}`;

  // Track this subscription
  let callbacks = subscriptions.get(jobId);
  if (!callbacks) {
    callbacks = new Set();
    subscriptions.set(jobId, callbacks);
    console.log(`[Pusher] Created new callback set for ${jobId}`);
  } else {
    console.log(`[Pusher] Reusing existing callback set for ${jobId} (${callbacks.size} existing)`);
  }
  callbacks.add(callback);

  // Check if there's a cached event we missed
  const cachedEvent = lastEvents.get(jobId);
  if (cachedEvent) {
    console.log(`[Pusher] ⚡ Replaying missed event for ${jobId}:`, cachedEvent);
    // Call the callback immediately with the cached event
    setTimeout(() => {
      try {
        callback(cachedEvent);
      } catch (error) {
        console.error(`[Pusher] Error replaying event for ${jobId}:`, error);
      }
    }, 0);
  }

  // Subscribe to channel if not already subscribed
  let channel = pusher.channel(channelName);
  if (!channel) {
    console.log("[Pusher] Subscribing to channel:", channelName);
    channel = pusher.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("[Pusher] ✓ Subscription succeeded:", channelName);
    });

    channel.bind("pusher:subscription_error", (error: unknown) => {
      console.error("[Pusher] ❌ Subscription error:", error);
    });
  }

  // Bind event handler - use a shared handler for this jobId
  let wrappedCallback = eventHandlers.get(jobId);
  
  if (!wrappedCallback) {
    // Create new handler for this job
    wrappedCallback = (event: NoteProgressEvent) => {
      console.log(`[Pusher] Progress update for ${jobId}:`, event);
      
      // Store this event so we can replay it if callbacks are added later
      lastEvents.set(jobId, event);
      
      // Call all registered callbacks for this jobId
      const jobCallbacks = subscriptions.get(jobId);
      if (jobCallbacks && jobCallbacks.size > 0) {
        console.log(`[Pusher] Dispatching to ${jobCallbacks.size} callback(s)`);
        jobCallbacks.forEach(cb => {
          try {
            cb(event);
          } catch (error) {
            console.error(`[Pusher] Error in callback for ${jobId}:`, error);
          }
        });
      } else {
        console.log(`[Pusher] No active callbacks for ${jobId}, event cached for replay`);
      }
    };
    
    eventHandlers.set(jobId, wrappedCallback);
    
    // Bind the event to the channel
    if (channel) {
      console.log("[Pusher] Binding event:", eventName);
      channel.bind(eventName, wrappedCallback);
    }
  } else {
    console.log(`[Pusher] Reusing existing event handler for ${eventName}`);
  }

  // Return cleanup function
  return () => {
    const jobCallbacks = subscriptions.get(jobId);
    if (jobCallbacks) {
      jobCallbacks.delete(callback);
      console.log(`[Pusher] Removed callback for ${jobId}, remaining callbacks: ${jobCallbacks.size}`);
      
      // DON'T clean up immediately when callbacks reach 0
      // The subscription should stay alive until the job completes or times out
      // This ensures we don't miss completion events during navigation
      if (jobCallbacks.size === 0) {
        console.log(`[Pusher] No active callbacks, but keeping subscription alive for ${jobId}`);
      }
    }
  };
}

/**
 * Cleanup all subscriptions for a specific job (e.g., when note is completed)
 */
export function cleanupPusherJob(jobId: string) {
  const pusher = getPusherClient();
  if (!pusher) return;

  const jobCallbacks = subscriptions.get(jobId);
  if (jobCallbacks || lastEvents.has(jobId)) {
    console.log(`[Pusher] ✓ Cleaning up completed job: ${jobId}`);
    subscriptions.delete(jobId);
    lastEvents.delete(jobId); // Clear cached event

    const channelName = "note-progress";
    const eventName = `note-${jobId}`;
    const channel = pusher.channel(channelName);

    if (channel) {
      // Get the event handler and unbind it
      const handler = eventHandlers.get(jobId);
      if (handler) {
        channel.unbind(eventName, handler);
        eventHandlers.delete(jobId);
        console.log(`[Pusher] Unbound event: ${eventName}`);
      }

      // Check if there are any other active subscriptions on this channel
      const hasOtherJobs = Array.from(subscriptions.keys()).length > 0;
      
      if (!hasOtherJobs) {
        // No other jobs, safe to unsubscribe from channel
        console.log("[Pusher] No more active jobs, unsubscribing from channel:", channelName);
        pusher.unsubscribe(channelName);
      } else {
        console.log(`[Pusher] Keeping channel subscribed (${subscriptions.size} other jobs active)`);
      }
    }
  }
}
