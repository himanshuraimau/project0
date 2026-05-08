import type { BatchItem } from "./types";

export interface CreatedSource {
  id: string;
  sourceKind: string;
  title: string;
  status: "queued" | "skipped";
  errorCode?: string;
}

export interface BatchCreateResponse {
  success: boolean;
  batchId: string;
  sources: CreatedSource[];
  pusherChannel: string;
  pusherBatchEvent: string;
  quota: { limit: number | null; used: number };
}

const DEFAULT_CONCURRENCY = 5;

/**
 * Lightweight p-limit replacement — caps concurrent promises.
 */
function pLimit(concurrency: number) {
  const queue: (() => void)[] = [];
  let active = 0;

  const next = () => {
    active -= 1;
    const fn = queue.shift();
    if (fn) fn();
  };

  return function run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const exec = () => {
        active += 1;
        task().then(
          (v) => {
            resolve(v);
            next();
          },
          (e) => {
            reject(e);
            next();
          }
        );
      };
      if (active < concurrency) exec();
      else queue.push(exec);
    });
  };
}

export async function createSourceBatch(
  items: BatchItem[],
  folderId: string | null
): Promise<BatchCreateResponse> {
  const res = await fetch("/api/sources/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId, items }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Batch create failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fire-and-forget per-source processing. Each call triggers one
 * /api/sources/:id/process HTTP request; per-source Pusher events
 * drive the UI. Returns after all requests settle (success or failure).
 */
export async function runBatchProcessing(
  sourceIds: string[],
  concurrency: number = DEFAULT_CONCURRENCY
): Promise<void> {
  const limit = pLimit(concurrency);

  await Promise.allSettled(
    sourceIds.map((id) =>
      limit(async () => {
        try {
          const res = await fetch(`/api/sources/${id}/process`, {
            method: "POST",
          });
          if (!res.ok) {
            console.error(
              `[client-runner] process ${id} returned ${res.status}`
            );
          }
        } catch (err) {
          console.error(`[client-runner] process ${id} threw:`, err);
        }
      })
    )
  );
}

export async function retrySource(sourceId: string): Promise<void> {
  const res = await fetch(`/api/sources/${sourceId}/retry`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Retry failed (${res.status})`);
  }
}

export async function deleteSource(sourceId: string): Promise<void> {
  const res = await fetch(`/api/sources/${sourceId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Delete failed (${res.status})`);
  }
}
