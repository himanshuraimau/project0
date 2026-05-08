"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Upload01Icon,
  Link01Icon,
  YoutubeIcon,
  TextAlignLeftIcon,
  Folder01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFolders } from "@/hooks/use-folders";
import { useUploadThing } from "@/lib/uploadthing/client";
import {
  createSourceBatch,
  retrySource,
  runBatchProcessing,
  type BatchCreateResponse,
} from "@/lib/sources/client-runner";
import {
  mimeToKind,
  type BatchItem,
  type SourceKind,
  type SourceStatus,
  SOURCE_MAX_PER_BATCH,
} from "@/lib/sources/types";
import { useBatchProgress } from "@/hooks/use-source-progress";
import { useActiveBatchesStore } from "@/lib/stores/active-batches-store";
import { SourceQueueRow, type QueueRowModel } from "./source-queue-row";

const MAX_FILE_BYTES = 128 * 1024 * 1024; // match UT bulkSources pdf cap

type Tab = "files" | "link" | "youtube" | "text";

interface StagedItem extends QueueRowModel {
  pendingFile?: File;
  pendingUrl?: string;
  pendingText?: { content: string; title?: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialFolderId?: string | null;
  onDone?: () => void;
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function kindForFile(file: File): SourceKind | null {
  const mimeKind = mimeToKind(file.type);
  if (mimeKind) return mimeKind;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".pptx")) return "pptx";
  if (/\.(png|jpe?g|webp|heic|heif)$/.test(name)) return "image";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

function classifyUrl(url: string): "youtube" | "url" | "invalid" {
  try {
    new URL(url);
  } catch {
    return "invalid";
  }
  return YT_REGEX.test(url) ? "youtube" : "url";
}

export function BulkUploadModal({
  open,
  onClose,
  initialFolderId = null,
  onDone,
}: Props) {
  const { folders, getFolders, loading: foldersLoading } = useFolders();
  const [tab, setTab] = useState<Tab>("files");
  const [items, setItems] = useState<StagedItem[]>([]);
  const [folderId, setFolderId] = useState<string | null>(initialFolderId);
  const [linksInput, setLinksInput] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [phase, setPhase] = useState<"staging" | "uploading" | "processing">(
    "staging"
  );
  const [batchId, setBatchId] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{
    limit: number | null;
    used: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const { startUpload: uploadBulk } = useUploadThing("bulkSources");
  const registerBatch = useActiveBatchesStore((s) => s.registerBatch);
  const applyEvent = useActiveBatchesStore((s) => s.applyEvent);

  useEffect(() => {
    if (open) getFolders();
  }, [open, getFolders]);

  useEffect(() => {
    if (open) {
      setItems([]);
      setLinksInput("");
      setYoutubeInput("");
      setTextTitle("");
      setTextBody("");
      setPhase("staging");
      setBatchId(null);
      setQuotaInfo(null);
      setFolderId(initialFolderId);
    }
  }, [open, initialFolderId]);

  // Wire live progress events → queue rows AND active-batches store.
  useBatchProgress(batchId, (event) => {
    applyEvent(event);
    setItems((prev) =>
      prev.map((item) => {
        if (item.transcriptId !== event.transcriptId) return item;
        return {
          ...item,
          status: event.status as SourceStatus,
          progress: event.progress,
          message: event.message,
          errorCode: event.errorCode ?? null,
          title: event.title || item.title,
        };
      })
    );
  });

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const rows: StagedItem[] = [];
      for (const f of files) {
        if (items.length + rows.length >= SOURCE_MAX_PER_BATCH) {
          toast.warning("Batch full", {
            description: `Max ${SOURCE_MAX_PER_BATCH} sources per batch.`,
          });
          break;
        }
        const kind = kindForFile(f);
        if (!kind) {
          toast.error("Unsupported file type", {
            description: `${f.name} isn't supported.`,
          });
          continue;
        }
        if (f.size > MAX_FILE_BYTES) {
          toast.error("File too large", {
            description: `${f.name} is over 128 MB.`,
          });
          continue;
        }
        rows.push({
          clientId: cryptoRandomId(),
          kind,
          title: f.name,
          subtitle: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
          status: "queued" as SourceStatus,
          progress: 0,
          pendingFile: f,
        });
      }
      if (rows.length > 0) setItems((p) => [...p, ...rows]);
    },
    [items.length]
  );

  const addLinks = useCallback(() => {
    const raw = linksInput.trim();
    if (!raw) return;
    const urls = raw
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const rows: StagedItem[] = [];
    let ytCount = 0;
    let webCount = 0;
    for (const u of urls) {
      if (items.length + rows.length >= SOURCE_MAX_PER_BATCH) break;
      const cls = classifyUrl(u);
      if (cls === "invalid") {
        toast.error("Invalid URL", { description: u });
        continue;
      }
      rows.push({
        clientId: cryptoRandomId(),
        kind: cls,
        title: (() => {
          try {
            return new URL(u).hostname;
          } catch {
            return u;
          }
        })(),
        subtitle: u,
        status: "queued",
        progress: 0,
        pendingUrl: u,
      });
      if (cls === "youtube") ytCount++;
      else webCount++;
    }
    if (rows.length > 0) {
      setItems((p) => [...p, ...rows]);
      setLinksInput("");
      toast.success("Links added", {
        description: `${webCount} web · ${ytCount} YouTube`,
      });
    }
  }, [linksInput, items.length]);

  const addYoutube = useCallback(() => {
    const url = youtubeInput.trim();
    if (!url) return;
    const cls = classifyUrl(url);
    if (cls !== "youtube") {
      toast.error("Not a YouTube URL");
      return;
    }
    if (items.length >= SOURCE_MAX_PER_BATCH) return;
    setItems((p) => [
      ...p,
      {
        clientId: cryptoRandomId(),
        kind: "youtube",
        title: `YouTube · ${url}`,
        subtitle: url,
        status: "queued",
        progress: 0,
        pendingUrl: url,
      },
    ]);
    setYoutubeInput("");
  }, [youtubeInput, items.length]);

  const addText = useCallback(() => {
    const content = textBody.trim();
    if (content.length < 20) {
      toast.error("Text is too short", {
        description: "Paste at least ~20 words.",
      });
      return;
    }
    const title = textTitle.trim() || "Pasted text";
    setItems((p) => [
      ...p,
      {
        clientId: cryptoRandomId(),
        kind: "text",
        title,
        subtitle: `${content.slice(0, 60)}${content.length > 60 ? "…" : ""}`,
        status: "queued",
        progress: 0,
        pendingText: { content, title },
      },
    ]);
    setTextTitle("");
    setTextBody("");
  }, [textBody, textTitle]);

  const removeRow = useCallback((clientId: string) => {
    setItems((p) => p.filter((r) => r.clientId !== clientId));
  }, []);

  const onRetry = useCallback(async (clientId: string) => {
    const row = itemsRef.current.find((r) => r.clientId === clientId);
    if (!row?.transcriptId) return;
    try {
      setItems((p) =>
        p.map((r) =>
          r.clientId === clientId
            ? { ...r, status: "processing", progress: 5, message: "Retrying…" }
            : r
        )
      );
      await retrySource(row.transcriptId);
    } catch (err) {
      toast.error("Retry failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setItems((p) =>
        p.map((r) =>
          r.clientId === clientId
            ? { ...r, status: "failed", message: "Retry failed" }
            : r
        )
      );
    }
  }, []);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const eligibleItems = useMemo(
    () => items.filter((i) => i.status === "queued"),
    [items]
  );

  const submit = useCallback(async () => {
    if (eligibleItems.length === 0) return;
    setPhase("uploading");

    // 1. Upload files to UploadThing (collective).
    const filesToUpload: File[] = [];
    const filePositions: string[] = [];
    for (const item of eligibleItems) {
      if (item.pendingFile) {
        filesToUpload.push(item.pendingFile);
        filePositions.push(item.clientId);
      }
    }

    let uploadResults: { key: string; url: string; name: string }[] = [];
    if (filesToUpload.length > 0) {
      setItems((prev) =>
        prev.map((r) =>
          filePositions.includes(r.clientId)
            ? {
                ...r,
                status: "uploading" as SourceStatus,
                progress: 5,
                message: "Uploading…",
              }
            : r
        )
      );
      try {
        const ut = await uploadBulk(filesToUpload);
        if (!ut) throw new Error("UploadThing returned no data.");
        uploadResults = ut.map((r) => ({
          key: r.key,
          url: r.url,
          name: r.name,
        }));
      } catch (err) {
        console.error("UT upload failed", err);
        toast.error("Upload failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
        setItems((prev) =>
          prev.map((r) =>
            filePositions.includes(r.clientId)
              ? {
                  ...r,
                  status: "failed",
                  progress: 100,
                  message: "Upload failed",
                }
              : r
          )
        );
        setPhase("staging");
        return;
      }
    }

    // 2. Build BatchItem[] matching UT results by index.
    const batchItems: BatchItem[] = [];
    const submitOrder: string[] = [];
    let utIdx = 0;
    for (const item of eligibleItems) {
      if (item.pendingFile) {
        const ut = uploadResults[utIdx++];
        if (!ut) continue;
        batchItems.push({
          kind: "file",
          uploadKey: ut.key,
          url: ut.url,
          filename: item.pendingFile.name,
          size: item.pendingFile.size,
          mime: item.pendingFile.type || "application/octet-stream",
        });
      } else if (item.pendingUrl) {
        batchItems.push(
          item.kind === "youtube"
            ? { kind: "youtube", url: item.pendingUrl }
            : { kind: "url", url: item.pendingUrl }
        );
      } else if (item.pendingText) {
        batchItems.push({
          kind: "text",
          title: item.pendingText.title,
          content: item.pendingText.content,
        });
      } else {
        continue;
      }
      submitOrder.push(item.clientId);
    }

    // 3. Create batch.
    let batchRes: BatchCreateResponse;
    try {
      batchRes = await createSourceBatch(batchItems, folderId);
    } catch (err) {
      toast.error("Couldn't start batch", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setPhase("staging");
      return;
    }

    setBatchId(batchRes.batchId);
    setQuotaInfo(batchRes.quota);

    // Register batch in the global store so the ProcessingTray can track it
    // even after the modal closes.
    registerBatch(
      batchRes.batchId,
      batchRes.sources.map((s) => ({
        transcriptId: s.id,
        title: s.title,
        status: s.status,
      }))
    );

    // 4. Link transcript IDs back to rows in submit order.
    setItems((prev) =>
      prev.map((r) => {
        const idx = submitOrder.indexOf(r.clientId);
        if (idx === -1) return r;
        const created = batchRes.sources[idx];
        if (!created) return r;
        return {
          ...r,
          transcriptId: created.id,
          status: created.status,
          message:
            created.status === "skipped"
              ? created.errorCode === "QUOTA_EXCEEDED"
                ? "Monthly source limit reached"
                : "Unsupported file type"
              : undefined,
          progress: created.status === "skipped" ? 100 : 5,
        };
      })
    );

    setPhase("processing");

    // 5. Fan out per-source processing (browser-driven).
    const idsToProcess = batchRes.sources
      .filter((s) => s.status === "queued")
      .map((s) => s.id);
    await runBatchProcessing(idsToProcess, 5);

    // 6. Done.
    toast.success("Batch complete", {
      description: "All sources finished processing.",
    });
    onDone?.();
  }, [eligibleItems, folderId, uploadBulk, onDone]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (phase !== "staging") return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) addFiles(files);
    },
    [addFiles, phase]
  );

  const queuedCount = items.filter((i) => i.status === "queued").length;
  const readyCount = items.filter((i) => i.status === "ready").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const anyInFlight = items.some(
    (i) => i.status === "processing" || i.status === "uploading"
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!anyInFlight && phase === "staging") onClose();
      }}
    >
      <div
        className="relative flex w-full max-w-2xl max-h-[90vh] flex-col rounded-2xl border border-border bg-card shadow-lg dark:bg-neutral-900/95 dark:border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={PlusSignIcon} className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Add sources
              </h2>
              <p className="text-xs text-muted-foreground">
                Files, links, YouTube, or pasted text — up to{" "}
                {SOURCE_MAX_PER_BATCH} at a time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={anyInFlight}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Drop zone — always visible */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (phase === "staging") setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => phase === "staging" && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            } ${phase !== "staging" ? "opacity-60 pointer-events-none" : ""}`}
          >
            <HugeiconsIcon
              icon={Upload01Icon}
              className="size-8 text-muted-foreground"
            />
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PDF · DOCX · PPTX · TXT · MD · CSV · Images · up to 128 MB each
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.heic,.heif,application/pdf,text/plain,text/markdown,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                addFiles(files);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {[
              { id: "files", label: "Files", icon: Upload01Icon },
              { id: "link", label: "Link", icon: Link01Icon },
              { id: "youtube", label: "YouTube", icon: YoutubeIcon },
              { id: "text", label: "Paste text", icon: TextAlignLeftIcon },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as Tab)}
                disabled={phase !== "staging"}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === t.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                } disabled:opacity-50`}
              >
                <HugeiconsIcon icon={t.icon} className="size-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "link" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Paste web URLs (space or newline separated — YouTube links OK)
              </label>
              <textarea
                value={linksInput}
                onChange={(e) => setLinksInput(e.target.value)}
                disabled={phase !== "staging"}
                placeholder="https://example.com/article&#10;https://www.youtube.com/watch?v=…"
                className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={addLinks}
                disabled={phase !== "staging" || !linksInput.trim()}
                className="h-9 rounded-lg bg-primary/10 text-primary px-3 text-xs font-medium hover:bg-primary/15 transition-colors disabled:opacity-50"
              >
                Add {linksInput.trim().split(/\s+/).filter(Boolean).length || ""}{" "}
                link(s)
              </button>
            </div>
          )}

          {tab === "youtube" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                YouTube URL
              </label>
              <div className="flex gap-2">
                <input
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  disabled={phase !== "staging"}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={addYoutube}
                  disabled={phase !== "staging" || !youtubeInput.trim()}
                  className="h-10 rounded-lg bg-primary/10 text-primary px-4 text-xs font-medium hover:bg-primary/15 transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {tab === "text" && (
            <div className="space-y-2">
              <input
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                disabled={phase !== "staging"}
                placeholder="Title (optional)"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <textarea
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                disabled={phase !== "staging"}
                placeholder="Paste text here…"
                className="w-full min-h-[140px] px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={addText}
                disabled={phase !== "staging" || textBody.trim().length < 20}
                className="h-9 rounded-lg bg-primary/10 text-primary px-3 text-xs font-medium hover:bg-primary/15 transition-colors disabled:opacity-50"
              >
                Add text
              </button>
            </div>
          )}

          {/* Folder picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Folder</label>
            <div className="flex items-center gap-3 h-11 rounded-lg border border-border bg-background pl-3 pr-1">
              <HugeiconsIcon
                icon={Folder01Icon}
                className="size-4 text-primary"
              />
              <Select
                value={folderId ?? "__all__"}
                onValueChange={(v) =>
                  setFolderId(v === "__all__" ? null : v)
                }
                disabled={foldersLoading || phase !== "staging"}
              >
                <SelectTrigger className="flex-1 h-11 border-0 bg-transparent shadow-none text-sm cursor-pointer focus:ring-0">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All notes</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Queue */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Queue ({items.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  {readyCount > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {readyCount} ready
                    </span>
                  )}
                  {readyCount > 0 && failedCount > 0 && " · "}
                  {failedCount > 0 && (
                    <span className="text-destructive">
                      {failedCount} failed
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1.5">
                {items.map((row) => (
                  <SourceQueueRow
                    key={row.clientId}
                    row={row}
                    onRemove={
                      phase === "staging" || row.status !== "queued"
                        ? () => removeRow(row.clientId)
                        : undefined
                    }
                    onRetry={
                      row.status === "failed"
                        ? () => onRetry(row.clientId)
                        : undefined
                    }
                    disabled={phase === "uploading"}
                  />
                ))}
              </div>
            </div>
          )}

          {quotaInfo && quotaInfo.limit !== null && (
            <p className="text-xs text-muted-foreground">
              {quotaInfo.used} / {quotaInfo.limit} sources used this month.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={anyInFlight}
            className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {phase === "processing" || phase === "uploading" ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={
              phase !== "staging" || queuedCount === 0
            }
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {phase === "uploading"
              ? "Uploading…"
              : phase === "processing"
                ? "Processing…"
                : `Add ${queuedCount || ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
