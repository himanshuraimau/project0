"use client";

import { useEffect, useRef, useState } from "react";
import {
  subscribeToBatchProgress,
  subscribeToSourceProgress,
} from "@/lib/realtime/pusher-source-client";
import type { SourceProgressEvent } from "@/lib/sources/types";

export function useSourceProgress(transcriptId: string | null | undefined) {
  const [event, setEvent] = useState<SourceProgressEvent | null>(null);

  useEffect(() => {
    if (!transcriptId) return;
    const unsub = subscribeToSourceProgress(transcriptId, setEvent);
    return unsub;
  }, [transcriptId]);

  return event;
}

export function useBatchProgress(
  batchId: string | null | undefined,
  onEvent?: (event: SourceProgressEvent) => void
) {
  const [events, setEvents] = useState<Record<string, SourceProgressEvent>>({});
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!batchId) return;
    const unsub = subscribeToBatchProgress(batchId, (evt) => {
      setEvents((prev) => ({ ...prev, [evt.transcriptId]: evt }));
      handlerRef.current?.(evt);
    });
    return unsub;
  }, [batchId]);

  return events;
}
