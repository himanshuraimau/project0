# Bulk Upload — Implementation Plan (study-app)

Companion to [bulk-upload-design.md](bulk-upload-design.md). That doc is the research + pattern. **This doc is the wiring diagram** — every step is a file path, the code to touch, and what it depends on.

**Headline:** yes, we can ship this in the existing app without new infra for v1. Every primitive we need already exists.

---

## 0. Executive decisions (lock these in before coding)

| Decision | Choice | Why |
|---|---|---|
| **Source abstraction** | Extend `Transcript` + add `SourceBatch` | Transcript already has `type` / `content` / `cleanContent` / `userId` / `notes[]`. Adding `status`, `errorCode`, `batchId`, summary fields is additive. No new top-level "Source" model. |
| **Job runner (v1)** | Client-driven fan-out, concurrency = 5 | Browser calls `POST /api/sources/:id/process` per source in parallel. Each route runs inside the existing 300s `maxDuration` envelope. Same shape as the current audio flow. No QStash/Inngest yet. |
| **Job runner (v2)** | QStash | Migrate once we hit a case where the user closing the tab drops work. Design leaves room for this. |
| **File storage** | UploadThing for docs/images, S3 presign for audio | Already wired. Keep current 128MB / 64MB caps in v1; don't chase the 200MB NotebookLM bar until we measure UT costs. |
| **Progress** | Reuse `NoteProgressManager` | Already battle-tested. New event shape is a superset of the existing `{jobId, stage, progress, message}`. |
| **Quota** | New counter `usedSourcesThisMonth` on `User` | Preserves existing `usedPdfProcessingThisMonth` / `usedAudioProcessingThisMonth` counters so single-file flows stay untouched. |
| **Parsers live in** | `src/lib/sources/parsers/` | Clean, type-dispatched. Existing PDF logic moves there as a library call; `/api/pdf/parse` becomes a thin wrapper. |
| **Backwards compat** | Keep `UploadTextModal` + `AudioUploadModal` as-is | New `BulkUploadModal` is opt-in. Migrate entry points one at a time. |

---

## Phase 1 — Foundation (backend, behind a flag)

Ships nothing to users. Sets up data model, per-source pipeline, and the bulk API surface. Single-file flows unchanged.

### 1.1 Schema changes — [prisma/schema.prisma](prisma/schema.prisma)

**Add `SourceBatch` model:**
```
SourceBatch {
  id           String   @id @default(cuid())
  userId       String
  folderId     String?
  status       String   // pending | processing | completed | partial | failed
  totalCount   Int
  readyCount   Int      @default(0)
  failedCount  Int      @default(0)
  skippedCount Int      @default(0)
  createdAt    DateTime @default(now())
  completedAt  DateTime?
  transcripts  Transcript[]
  @@index([userId, createdAt])
}
```

**Extend `Transcript`:**
```
+ batchId             String?      // FK → SourceBatch
+ batch               SourceBatch? @relation(...)
+ sourceKind          String       // "pdf" | "docx" | "txt" | "md" | "pptx" | "csv" | "epub" | "url" | "youtube" | "audio" | "image" | "text" | "drive"
+ status              String       // "queued" | "uploading" | "processing" | "ready" | "failed" | "skipped"
+ stage               String?      // fine-grained: "parsing" | "chunking" | "embedding" | "summarizing"
+ progress            Int          @default(0)
+ errorCode           String?      // one of the 6 buckets from design doc §6
+ errorMessage        String?
+ uploadKey           String?      // UploadThing key or S3 key
+ rawInput            Json?        // {url} | {text} | {filename,size,mime} | {documentId,mimeType}
+ wordCount           Int?
+ tokenCount          Int?
+ summary             String?
+ keyTopics           String[]     @default([])
+ suggestedQuestions  String[]     @default([])
+ readyAt             DateTime?
+ @@index([batchId])
+ @@index([userId, status])
```

**Extend `User`:**
```
+ usedSourcesThisMonth  Int  @default(0)
```

**Extend `Subscription`:**
```
+ sourcesPerMonth       Int? // null = unlimited
+ sourcesPerBatch       Int? // null = unlimited; free tier might cap at 10
```

Migration name: `add_bulk_sources`. Run via `npx prisma migrate dev --name add_bulk_sources`.

### 1.2 Extract parsing into `src/lib/sources/`

**New directory layout:**
```
src/lib/sources/
  types.ts                 // Source enums, ParseResult, BatchItem input shapes
  parse.ts                 // dispatcher: (sourceKind, input) → ParseResult
  parsers/
    pdf.ts                 // wraps existing PDFParser
    docx.ts                // uses mammoth (new dep)
    text.ts                // pass-through (txt, md, pasted text)
    pptx.ts                // uses officeparser (new dep)
    csv.ts                 // uses papaparse → markdown table
    url.ts                 // fetch + @mozilla/readability (new dep) + paywall heuristic
    youtube.ts             // wraps youtube-transcript
    audio.ts               // wraps existing Whisper flow from transcribe route
    image.ts               // stubbed v1, returns UNSUPPORTED_FORMAT
  pipeline.ts              // the per-source orchestrator (parse → chunk → embed → summarize → ready)
  summarize.ts             // LLM call: { summary, keyTopics[], suggestedQuestions[] }
  errors.ts                // maps thrown errors → { errorCode, errorMessage }
  quota.ts                 // atomic quota reserve/release
  progress.ts              // thin wrapper over NoteProgressManager with the new stage vocabulary
```

**What to move, what to add:**

| File | Action | Details |
|---|---|---|
| `src/lib/pdf-parser/index.ts` | Keep | Called by `parsers/pdf.ts`. No changes. |
| [src/app/api/pdf/parse/route.ts](src/app/api/pdf/parse/route.ts) | Keep | Becomes a thin caller of `parsers/pdf.ts`. Single-file flow still works. |
| [src/lib/course/embedding-service.ts](src/lib/course/embedding-service.ts) | Keep | `chunkText`, `indexNoteContent` called as-is from `pipeline.ts`. |
| [src/lib/note-progress-manager.ts](src/lib/note-progress-manager.ts) | Extend | Add a `publishSourceProgress({transcriptId, batchId, stage, progress, ...})` helper alongside the existing `publish()`. Keep existing API untouched. |
| [src/lib/feature-gate-service.ts](src/lib/feature-gate-service.ts) | Extend | Add `reserveSourceSlots(userId, count)` using the same `updateMany + increment` pattern (lines 108–150). Atomic. |

**New deps:**
- `mammoth` — DOCX → text
- `officeparser` — PPTX → text
- `papaparse` — CSV
- `@mozilla/readability` + `jsdom` — URL text extraction

### 1.3 Per-source pipeline — `src/lib/sources/pipeline.ts`

One function, one Transcript, fully idempotent:
```
processSource(transcriptId):
  1. load Transcript; if already ready → return (idempotent)
  2. emit stage="parsing"
     dispatch to parsers/* by sourceKind
     normalize text, compute wordCount
     if wordCount < 20 → fail NO_CONTENT
     if wordCount > 500_000 → fail UNSUPPORTED_FORMAT (oversize)
  3. update Transcript {content, cleanContent, wordCount, tokenCount}
  4. emit stage="chunking"
     chunkText(cleanContent) from embedding-service
  5. emit stage="embedding"
     indexNoteContent(transcriptId, cleanContent) — reuse existing
     NOTE: current schema indexes NoteChunk by note_id, not transcript_id.
     Either:
       (a) create a placeholder Note per Transcript (current behavior for PDFs), or
       (b) migrate NoteChunk to also key on transcriptId (cleaner but bigger change).
     v1: (a) — create a minimal Note row whose content = Transcript.cleanContent,
          then call indexNoteContent(note.id, text). Matches what /api/pdf/parse
          already does today.
  6. emit stage="summarizing"
     summarize.ts → LLM call (Gemini flash per recent fix commit 5a5bf24),
     store into Transcript.summary / keyTopics / suggestedQuestions
  7. mark Transcript.status="ready", readyAt=now()
     bump SourceBatch.readyCount
     on last row in batch, set SourceBatch.status="completed"|"partial"
```

Every step wrapped in try/catch that maps to one of the 6 errorCodes (design doc §6) and emits `stage="failed"`.

### 1.4 API routes

**New — [src/app/api/sources/batch/route.ts](src/app/api/sources/batch/route.ts):**

```
POST /api/sources/batch
  Auth: getUserFromAuth (existing helper)
  Body: { folderId?: string, items: BatchItem[] }
      where BatchItem =
        | { kind: "file",    uploadKey, filename, size, mime }
        | { kind: "url",     url }
        | { kind: "youtube", url }
        | { kind: "text",    title?, content }
        | { kind: "audio",   s3Key }    // from existing presign flow
        | { kind: "drive",   documentId, mimeType, name }   // phase 4

  Flow:
   1. getUserFromAuth → userId
   2. feature-gate: reserveSourceSlots(userId, items.length).
      Slots that can't be reserved become status="skipped" w/ QUOTA_EXCEEDED.
   3. Create SourceBatch row (totalCount = items.length)
   4. For each eligible item, create Transcript row with:
        status="queued", sourceKind, uploadKey/rawInput, batchId, userId, folderId
   5. Return { batchId, sources: [{id, sourceKind, status, errorCode?}], pusherChannel }

  NO job kickoff here. Client does the fan-out. (See client section.)
```

**New — [src/app/api/sources/[id]/process/route.ts](src/app/api/sources/[id]/process/route.ts):**

```
POST /api/sources/:id/process
  export const maxDuration = 300       // Vercel Pro cap
  export const runtime = 'nodejs'

  Auth + ownership check
  Call processSource(id) from pipeline.ts
  Return { status, errorCode? }
```

**New — [src/app/api/sources/[id]/retry/route.ts](src/app/api/sources/[id]/retry/route.ts):**

```
POST /api/sources/:id/retry
  Auth + ownership, Transcript.status must be "failed"
  Reset status="queued", clear errorCode/errorMessage
  Delete any partial NoteChunks (defensive)
  Immediately call processSource(id)
```

**New — [src/app/api/sources/[id]/route.ts](src/app/api/sources/[id]/route.ts):**

```
GET    → fetch single source (for retry/detail view)
DELETE → cascade: delete Transcript (existing cascade handles Notes/NoteChunks)
         if batch exists, bump skippedCount + possibly transition batch status
```

**New — [src/app/api/sources/batch/[batchId]/route.ts](src/app/api/sources/batch/[batchId]/route.ts):**

```
GET → { batch, sources: Transcript[] }   // for recovery on page reload
```

### 1.5 Upload prep — [src/app/api/uploadthing/core.ts](src/app/api/uploadthing/core.ts)

Add a new endpoint alongside existing ones:
```
bulkSources: f({
  pdf:  { maxFileSize: "128MB", maxFileCount: 50 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        { maxFileSize: "32MB", maxFileCount: 50 },   // docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        { maxFileSize: "64MB", maxFileCount: 50 },   // pptx
  "text/plain": { maxFileSize: "10MB", maxFileCount: 50 },
  "text/markdown": { maxFileSize: "10MB", maxFileCount: 50 },
  "text/csv": { maxFileSize: "20MB", maxFileCount: 50 },
})
  .middleware(existing auth middleware)
  .onUploadComplete(({metadata, file}) => ({ url: file.ufsUrl, key: file.key, size: file.size, name: file.name }))
```

For audio, keep using the existing S3 presign route [src/app/api/audio/upload-url/route.ts](src/app/api/audio/upload-url/route.ts) — no change.

### 1.6 Pusher payload — [src/lib/note-progress-manager.ts](src/lib/note-progress-manager.ts)

Keep current `note-progress` channel + `note-{jobId}` events for note generation.
**Add** `source-progress` channel + `source-{transcriptId}` events with payload:
```
{
  transcriptId: string,
  batchId: string,
  sourceKind: string,
  status: "queued" | "uploading" | "processing" | "ready" | "failed" | "skipped",
  stage: "parsing" | "chunking" | "embedding" | "summarizing" | null,
  progress: 0-100,
  message: string,
  errorCode?: string,
  updatedAt: ISO string,
}
```

Client can also subscribe to a batch-level channel `batch-{batchId}` for a single subscription that fans out — emit the same event on both channels.

### 1.7 Feature flag

Env var `NEXT_PUBLIC_BULK_UPLOAD_ENABLED=true`. All new UI gated on this. Existing code untouched.

---

## Phase 2 — Parsers

Fill in the parser modules from Phase 1.2. Each is self-contained.

| Parser | File | Reuses | New dep |
|---|---|---|---|
| PDF | `parsers/pdf.ts` | existing `PDFParser` in [src/lib/pdf-parser/index.ts](src/lib/pdf-parser/index.ts) | — |
| DOCX | `parsers/docx.ts` | — | `mammoth` |
| TXT / MD | `parsers/text.ts` | — | — |
| PPTX | `parsers/pptx.ts` | — | `officeparser` |
| CSV | `parsers/csv.ts` | — | `papaparse` |
| URL | `parsers/url.ts` | — | `@mozilla/readability`, `jsdom` |
| YouTube | `parsers/youtube.ts` | existing `youtube-transcript` dep | — |
| Audio | `parsers/audio.ts` | existing transcribe logic from [src/app/api/audio/transcribe/route.ts](src/app/api/audio/transcribe/route.ts) | — |
| Image (stub v1) | `parsers/image.ts` | — | defer to Phase 4 |

**URL parser specifics:**
- `fetch(url, {redirect: 'follow', timeout: 15_000})`
- `jsdom` → `Readability().parse()` → title + textContent
- Paywall heuristic: HTTP 402/403; known-domain list (NYT, WSJ, FT, Bloomberg, Economist); text content < 500 chars after fetch of a page > 50KB HTML → warn.
- YouTube URL detection: if `url` matches youtube regex, dispatch to youtube parser instead.

**Audio parser specifics:**
- Already have `transcribeAudioAndCreateNote` — refactor into `transcribeAudio(s3Url): Promise<string>` and call it from both the old route (preserved) and the new parser.

Each parser returns `{ text: string, title?: string, metadata?: Record<string,unknown> }`. The dispatcher normalizes and hands off to the pipeline.

---

## Phase 3 — UI

This is where users see the feature. Builds the `BulkUploadModal` and the floating tray.

### 3.1 New components

**[src/components/sources/bulk-upload-modal.tsx](src/components/sources/bulk-upload-modal.tsx)** — the primary modal.

Structure (matches design doc §3.2):
- Drop zone (always visible at top)
- Tabs below: `Link | YouTube | Paste text | Record`
- Queue list: rows tick through states via Pusher
- Footer: `[Cancel]` `[Add N]` buttons

Internal state: `{ items: QueueItem[], batchId?: string, phase: "staging" | "submitting" | "processing" | "done" }`

Reuses:
- File input / drag-drop logic pattern from [src/components/pdf/upload-text-modal.tsx](src/components/pdf/upload-text-modal.tsx)
- Folder select dropdown from same file, lines 326–357
- `useUploadThing` from `@uploadthing/react` for client-side multi-file upload to the new `bulkSources` endpoint
- S3 presign + direct PUT pattern from [src/components/audio/audio-upload-modal.tsx](src/components/audio/audio-upload-modal.tsx) for audio items
- `toast` from `sonner` for soft warnings/errors — matches existing style

**[src/components/sources/source-queue-row.tsx](src/components/sources/source-queue-row.tsx)** — single row.

Props: `{ source, onRemove, onRetry }`. Renders icon + title + subtitle + status chip + progress line + action button. 6-state chip component inline.

**[src/components/sources/processing-tray.tsx](src/components/sources/processing-tray.tsx)** — persistent tray.

Floats bottom-right. Subscribes to all in-flight batches for the user (pulled from a `/api/sources/batch?active=true` list). Shows "Processing N sources" with a click-to-expand. Mounted once at the dashboard layout level.

**[src/components/sources/add-sources-button.tsx](src/components/sources/add-sources-button.tsx)** — the trigger.

Single button that opens the modal. Drop-in replacement for the current "Upload PDF" / "Upload audio" buttons. Flag-gated.

### 3.2 Client-side orchestration — `src/lib/sources/client-runner.ts`

The brain of the browser-side fan-out:
```
runBatch(items) =>
  1. Upload files:
     - documents → useUploadThing on "bulkSources" endpoint (parallel inside UT)
     - audio → S3 presign per file → PUT direct to S3 (parallel, cap 3)
     - url/youtube/text → no upload
  2. POST /api/sources/batch { items: [{kind, uploadKey|url|content|s3Key, ...}] }
     Get back { batchId, sources[] }
  3. Subscribe to Pusher channel "batch-{batchId}" — updates come in live
  4. Fan out POST /api/sources/:id/process with p-limit concurrency=5
     Fire-and-forget each; server pushes progress via Pusher.
  5. Modal stays open; floating tray takes over if modal closed.
```

New dep: `p-limit` for concurrency control (tiny, widely used).

### 3.3 Pusher subscription — extend [src/hooks/use-pusher-progress.ts](src/hooks/use-pusher-progress.ts)

Add `useSourceProgress(transcriptId)` and `useBatchProgress(batchId)` hooks alongside the existing `usePusherProgress(jobId)`. Keep API shape identical so components can subscribe the same way.

### 3.4 Dashboard integration

- Replace/augment the "Upload" entry points in:
  - [src/app/dashboard/*](src/app/dashboard) — wherever the current PDF/audio upload buttons live
- Mount `<ProcessingTray />` once in the dashboard layout
- Rows in the source list (folder view) become clickable to open the detail view — but that's a separate surface; v1 can keep the existing note list UI and just render newly-added notes there when their underlying Transcript goes `ready`.

### 3.5 Retry UX

Each failed row has a Retry button → `POST /api/sources/:id/retry`. Works even if the original modal is closed — tray exposes it.

---

## Phase 4 — Nice-to-haves

Pure additions, zero risk to Phase 1–3.

- **Drive picker** — `react-google-drive-picker`; maps to `kind: "drive"` BatchItems. Server fetches via Drive API (export as PDF, run through PDF parser).
- **Image OCR** — `parsers/image.ts` using Gemini Vision (`@ai-sdk/google` already installed).
- **Bulk URL paste box** — dedicated textarea tab that space/newline-splits into rows before submit.
- **Paywall domain list** — client-side soft warning before submit, matches design doc §3.5.
- **Deduplication warning** — client calls `/api/sources/exists?url=…` against the user's current folder; soft warning only.

---

## Phase 5 — Durability (when we outgrow v1)

Trigger condition: any of
- >5% of users report "lost batch" after closing browser
- Median batch time > 2 minutes (users won't keep tab open)
- p95 per-source latency > 60 seconds

Migration:
1. Add [src/app/api/sources/queue/webhook/route.ts](src/app/api/sources/queue/webhook/route.ts) — QStash target. Takes `{transcriptId}`, calls `processSource()`.
2. Change `/api/sources/batch` to publish to QStash instead of returning a fan-out list.
3. Client stops calling `/process` directly. Just subscribes to Pusher.
4. No UI changes. No data model changes.

The Phase 1 design deliberately puts the `processSource()` function at the center so Phase 5 is a kickoff swap, not a rewrite.

---

## File-by-file checklist

### New files
- [ ] [prisma/schema.prisma](prisma/schema.prisma) — schema additions (diff above)
- [ ] `src/lib/sources/types.ts`
- [ ] `src/lib/sources/parse.ts`
- [ ] `src/lib/sources/pipeline.ts`
- [ ] `src/lib/sources/summarize.ts`
- [ ] `src/lib/sources/errors.ts`
- [ ] `src/lib/sources/quota.ts`
- [ ] `src/lib/sources/progress.ts`
- [ ] `src/lib/sources/client-runner.ts`
- [ ] `src/lib/sources/parsers/pdf.ts`
- [ ] `src/lib/sources/parsers/docx.ts`
- [ ] `src/lib/sources/parsers/text.ts`
- [ ] `src/lib/sources/parsers/pptx.ts`
- [ ] `src/lib/sources/parsers/csv.ts`
- [ ] `src/lib/sources/parsers/url.ts`
- [ ] `src/lib/sources/parsers/youtube.ts`
- [ ] `src/lib/sources/parsers/audio.ts`
- [ ] `src/lib/sources/parsers/image.ts` (stub)
- [ ] `src/app/api/sources/batch/route.ts`
- [ ] `src/app/api/sources/[id]/process/route.ts`
- [ ] `src/app/api/sources/[id]/retry/route.ts`
- [ ] `src/app/api/sources/[id]/route.ts`
- [ ] `src/app/api/sources/batch/[batchId]/route.ts`
- [ ] `src/components/sources/bulk-upload-modal.tsx`
- [ ] `src/components/sources/source-queue-row.tsx`
- [ ] `src/components/sources/processing-tray.tsx`
- [ ] `src/components/sources/add-sources-button.tsx`

### Files to modify (additive)
- [ ] [src/app/api/uploadthing/core.ts](src/app/api/uploadthing/core.ts) — add `bulkSources` endpoint
- [ ] [src/lib/note-progress-manager.ts](src/lib/note-progress-manager.ts) — add `publishSourceProgress()`, `source-progress` channel
- [ ] [src/hooks/use-pusher-progress.ts](src/hooks/use-pusher-progress.ts) — add `useSourceProgress`, `useBatchProgress`
- [ ] [src/lib/feature-gate-service.ts](src/lib/feature-gate-service.ts) — add `reserveSourceSlots`
- [ ] Dashboard layout — mount `<ProcessingTray />`
- [ ] Folder/dashboard views — swap upload trigger to `<AddSourcesButton />` behind the flag

### Files untouched (important)
- [src/app/api/pdf/parse/route.ts](src/app/api/pdf/parse/route.ts) — existing single-PDF flow stays
- [src/app/api/audio/transcribe/route.ts](src/app/api/audio/transcribe/route.ts) — existing single-audio flow stays
- [src/components/pdf/upload-text-modal.tsx](src/components/pdf/upload-text-modal.tsx) — existing modal stays
- [src/components/audio/audio-upload-modal.tsx](src/components/audio/audio-upload-modal.tsx) — existing modal stays
- [src/lib/course/embedding-service.ts](src/lib/course/embedding-service.ts) — unchanged; called by pipeline

---

## New dependencies (all small)

```
mammoth                  ^1.x   DOCX parse
officeparser             ^5.x   PPTX parse
papaparse                ^5.x   CSV parse
@mozilla/readability     ^0.5   URL text extract
jsdom                    ^25.x  URL DOM parse
p-limit                  ^6.x   client-side concurrency cap
```

Optional (defer to Phase 4): `react-google-drive-picker`.

No new backend/queue/observability vendor in v1.

---

## Env vars to add

```
NEXT_PUBLIC_BULK_UPLOAD_ENABLED=false   # flag, flip to true when ready
SOURCE_CONCURRENCY_PER_USER=5           # server-side cap (enforced per-process route)
SOURCE_MAX_WORDS=500000                 # matches NotebookLM
SOURCE_MAX_PER_BATCH=50                 # matches NotebookLM free tier
```

Everything else (Pusher, UploadThing, OpenAI, S3, DATABASE_URL, BETTER_AUTH_*) already configured.

---

## Testing strategy

- **Schema/migration:** run `prisma migrate` on a throwaway DB first; confirm cascade delete still works.
- **Pipeline unit:** one test per parser (fixtures: a 3-page PDF, a YouTube URL with captions, a small docx, a pasted text blob, a paywalled-ish URL) → assert `processSource()` produces a `ready` Transcript with non-empty chunks + summary.
- **Pipeline error path:** one test per errorCode. Feed a copy-protected PDF (COPY_PROTECTED), empty audio (NO_CONTENT), 301-loop URL (FETCH_FAILED), etc.
- **Batch API:** create a batch of 5 mixed sources, fan out, assert Pusher events arrive in expected sequence.
- **Quota:** seed user at limit-1, create batch of 3, assert 1 goes through and 2 are `skipped` with `QUOTA_EXCEEDED`.
- **Retry idempotency:** fail a source, retry, assert no duplicate NoteChunks (PK should enforce; test confirms).
- **End-to-end manual:** browser flow, 10 mixed sources, close tab mid-processing, reopen → expect in-flight sources to appear as whatever they actually were when the server last acked them. In Phase 1 (no queue), expect some to end in `failed`; that's the known trade-off.

---

## Rollout

1. **Week 1:** schema migration + `src/lib/sources/*` scaffolding + pipeline + one parser (PDF reuse). Merge behind flag, no UI.
2. **Week 2:** rest of parsers + batch/process API routes. Internal dogfood via Postman.
3. **Week 3:** modal + queue row + tray. Flag on for team accounts only.
4. **Week 4:** monitor, fix paper cuts, flip flag for all users.
5. **Week 5+:** Phase 4 additions. Phase 5 migration if metrics demand.

Total v1 scope: ~20 new files, ~6 modified files, ~5 new deps, zero breaking changes. Feasible.
