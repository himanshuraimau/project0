"use client";

import { getPusherClient } from "./pusher-client";
import type { SourceProgressEvent } from "@/lib/sources/types";

const SOURCE_PROGRESS_CHANNEL = "source-progress";

interface SourceSubs {
  callbacks: Set<(event: SourceProgressEvent) => void>;
  boundHandler?: (event: SourceProgressEvent) => void;
  lastEvent?: SourceProgressEvent;
}

const globalForSourcePusher = globalThis as typeof globalThis & {
  __sourcePusherSubs?: Map<string, SourceSubs>;
};

const subsByKey =
  globalForSourcePusher.__sourcePusherSubs ||
  new Map<string, SourceSubs>();
globalForSourcePusher.__sourcePusherSubs = subsByKey;

function subscribe(
  eventKey: string,
  callback: (event: SourceProgressEvent) => void
): () => void {
  const pusher = getPusherClient();
  if (!pusher) return () => {};

  let entry = subsByKey.get(eventKey);
  if (!entry) {
    entry = { callbacks: new Set() };
    subsByKey.set(eventKey, entry);
  }
  entry.callbacks.add(callback);

  if (entry.lastEvent) {
    setTimeout(() => {
      try {
        callback(entry!.lastEvent!);
      } catch (e) {
        console.error("[Pusher/source] replay error:", e);
      }
    }, 0);
  }

  let channel = pusher.channel(SOURCE_PROGRESS_CHANNEL);
  if (!channel) {
    channel = pusher.subscribe(SOURCE_PROGRESS_CHANNEL);
  }

  if (!entry.boundHandler) {
    const handler = (event: SourceProgressEvent) => {
      const e = subsByKey.get(eventKey);
      if (!e) return;
      e.lastEvent = event;
      e.callbacks.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error("[Pusher/source] callback error:", err);
        }
      });
    };
    entry.boundHandler = handler;
    channel.bind(eventKey, handler);
  }

  return () => {
    const e = subsByKey.get(eventKey);
    if (!e) return;
    e.callbacks.delete(callback);
  };
}

export function subscribeToSourceProgress(
  transcriptId: string,
  callback: (event: SourceProgressEvent) => void
): () => void {
  return subscribe(`source-${transcriptId}`, callback);
}

export function subscribeToBatchProgress(
  batchId: string,
  callback: (event: SourceProgressEvent) => void
): () => void {
  return subscribe(`batch-${batchId}`, callback);
}

export function cleanupSourceSubscription(eventKey: string) {
  const pusher = getPusherClient();
  if (!pusher) return;
  const entry = subsByKey.get(eventKey);
  if (!entry) return;
  const channel = pusher.channel(SOURCE_PROGRESS_CHANNEL);
  if (channel && entry.boundHandler) {
    channel.unbind(eventKey, entry.boundHandler);
  }
  subsByKey.delete(eventKey);
}
