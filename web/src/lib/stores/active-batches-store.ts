import { create } from "zustand";
import type { SourceProgressEvent } from "@/lib/sources/types";

export interface ActiveBatchRow {
  transcriptId: string;
  title: string;
  status: string;
  progress: number;
  errorCode?: string | null;
}

export interface ActiveBatch {
  batchId: string;
  totalCount: number;
  rows: Record<string, ActiveBatchRow>;
  createdAt: number;
}

interface ActiveBatchesState {
  batches: Record<string, ActiveBatch>;
  registerBatch: (
    batchId: string,
    initialRows: { transcriptId: string; title: string; status: string }[]
  ) => void;
  applyEvent: (event: SourceProgressEvent) => void;
  dismissBatch: (batchId: string) => void;
  clearCompleted: () => void;
}

export const useActiveBatchesStore = create<ActiveBatchesState>((set) => ({
  batches: {},

  registerBatch: (batchId, initialRows) =>
    set((state) => {
      if (state.batches[batchId]) return state;
      const rows: Record<string, ActiveBatchRow> = {};
      for (const r of initialRows) {
        rows[r.transcriptId] = {
          transcriptId: r.transcriptId,
          title: r.title,
          status: r.status,
          progress: 0,
        };
      }
      return {
        batches: {
          ...state.batches,
          [batchId]: {
            batchId,
            totalCount: initialRows.length,
            rows,
            createdAt: Date.now(),
          },
        },
      };
    }),

  applyEvent: (event) =>
    set((state) => {
      if (!event.batchId) return state;
      const batch = state.batches[event.batchId];
      if (!batch) return state;
      const existing = batch.rows[event.transcriptId];
      const next: ActiveBatchRow = {
        transcriptId: event.transcriptId,
        title: event.title || existing?.title || "Source",
        status: event.status,
        progress: event.progress,
        errorCode: event.errorCode ?? null,
      };
      return {
        batches: {
          ...state.batches,
          [event.batchId]: {
            ...batch,
            rows: { ...batch.rows, [event.transcriptId]: next },
          },
        },
      };
    }),

  dismissBatch: (batchId) =>
    set((state) => {
      const { [batchId]: _dropped, ...rest } = state.batches;
      void _dropped;
      return { batches: rest };
    }),

  clearCompleted: () =>
    set((state) => {
      const kept: Record<string, ActiveBatch> = {};
      for (const [id, batch] of Object.entries(state.batches)) {
        const rows = Object.values(batch.rows);
        const terminal = rows.every(
          (r) =>
            r.status === "ready" ||
            r.status === "failed" ||
            r.status === "skipped"
        );
        if (!terminal) kept[id] = batch;
      }
      return { batches: kept };
    }),
}));

export function isBatchTerminal(batch: ActiveBatch): boolean {
  const rows = Object.values(batch.rows);
  if (rows.length === 0) return false;
  return rows.every(
    (r) =>
      r.status === "ready" || r.status === "failed" || r.status === "skipped"
  );
}

export function batchSummary(batch: ActiveBatch) {
  const rows = Object.values(batch.rows);
  let ready = 0,
    failed = 0,
    skipped = 0,
    inFlight = 0;
  for (const r of rows) {
    if (r.status === "ready") ready++;
    else if (r.status === "failed") failed++;
    else if (r.status === "skipped") skipped++;
    else inFlight++;
  }
  return {
    total: rows.length,
    ready,
    failed,
    skipped,
    inFlight,
  };
}
