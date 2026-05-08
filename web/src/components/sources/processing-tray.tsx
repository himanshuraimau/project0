"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Loading03Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import {
  batchSummary,
  isBatchTerminal,
  useActiveBatchesStore,
} from "@/lib/stores/active-batches-store";
import { BatchPusherBridge } from "./batch-pusher-bridge";

/**
 * Floating tray that shows all active source batches for the user's session.
 * Survives closing the bulk-upload modal. Auto-dismisses terminal batches
 * after a short grace window so users can see the "done" state.
 */
export function ProcessingTray() {
  const batches = useActiveBatchesStore((s) => s.batches);
  const dismissBatch = useActiveBatchesStore((s) => s.dismissBatch);
  const [expanded, setExpanded] = useState(true);

  const batchList = useMemo(
    () =>
      Object.values(batches).sort((a, b) => b.createdAt - a.createdAt),
    [batches]
  );

  // Auto-dismiss batches 10s after they go terminal.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const batch of batchList) {
      if (isBatchTerminal(batch)) {
        timers.push(
          setTimeout(() => {
            dismissBatch(batch.batchId);
          }, 10_000)
        );
      }
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [batchList, dismissBatch]);

  if (batchList.length === 0) return null;

  const totalInFlight = batchList.reduce(
    (acc, b) => acc + batchSummary(b).inFlight,
    0
  );
  const headerLabel =
    totalInFlight > 0
      ? `Processing ${totalInFlight} source${totalInFlight === 1 ? "" : "s"}…`
      : "All batches complete";

  return (
    <>
      {/* Invisible Pusher subscriptions per batch */}
      {batchList.map((b) => (
        <BatchPusherBridge key={b.batchId} batchId={b.batchId} />
      ))}

      <div className="fixed bottom-4 right-4 z-40 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-lg dark:bg-neutral-900/95 dark:border-neutral-800">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            {totalInFlight > 0 ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="size-4 animate-spin"
              />
            ) : (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="size-4 text-emerald-600 dark:text-emerald-400"
              />
            )}
          </div>
          <p className="flex-1 text-sm font-medium truncate">{headerLabel}</p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <HugeiconsIcon
              icon={expanded ? ArrowDown01Icon : ArrowUp01Icon}
              className="size-4"
            />
          </button>
        </div>

        {expanded && (
          <div className="max-h-[40vh] overflow-y-auto p-2 space-y-2">
            {batchList.map((batch) => {
              const summary = batchSummary(batch);
              const terminal = isBatchTerminal(batch);
              const percent = Math.round(
                ((summary.ready + summary.failed + summary.skipped) /
                  Math.max(1, summary.total)) *
                  100
              );
              return (
                <div
                  key={batch.batchId}
                  className="rounded-lg border border-border/70 bg-background/50 p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate">
                      Batch of {summary.total}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {summary.ready > 0 && (
                        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            className="size-3"
                          />
                          {summary.ready}
                        </span>
                      )}
                      {summary.failed > 0 && (
                        <span className="flex items-center gap-0.5 text-destructive">
                          <HugeiconsIcon
                            icon={AlertCircleIcon}
                            className="size-3"
                          />
                          {summary.failed}
                        </span>
                      )}
                      {summary.skipped > 0 && (
                        <span className="text-amber-600 dark:text-amber-500">
                          {summary.skipped} skipped
                        </span>
                      )}
                      {terminal && (
                        <button
                          type="button"
                          onClick={() => dismissBatch(batch.batchId)}
                          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Dismiss batch"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-[width] duration-300 ${
                        terminal
                          ? summary.failed > 0 && summary.ready === 0
                            ? "bg-destructive"
                            : "bg-emerald-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(4, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
