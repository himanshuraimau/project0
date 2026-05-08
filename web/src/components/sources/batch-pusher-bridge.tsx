"use client";

import { useEffect } from "react";
import { subscribeToBatchProgress } from "@/lib/realtime/pusher-source-client";
import { useActiveBatchesStore } from "@/lib/stores/active-batches-store";

/**
 * One subscription per active batch. Feeds events into the global store so
 * the ProcessingTray (and anything else) can render without each component
 * holding its own subscription.
 */
export function BatchPusherBridge({ batchId }: { batchId: string }) {
  const applyEvent = useActiveBatchesStore((s) => s.applyEvent);

  useEffect(() => {
    const unsub = subscribeToBatchProgress(batchId, (event) => {
      applyEvent(event);
    });
    return unsub;
  }, [batchId, applyEvent]);

  return null;
}
