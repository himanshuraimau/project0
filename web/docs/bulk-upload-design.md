# Bulk Upload — Design Doc

A NotebookLM-style bulk source ingestion feature for the study-app. This document is **research + implementation pattern only**. No code is written yet. It is the spec the implementation will be graded against.

---

## 1. What NotebookLM actually does (research)

This section is the ground truth. Everything below in sections 2+ is derived from it.

### 1.1 The product surface

NotebookLM's "Add sources" dialog is a **single modal with mixed input modes**, not a classic "pick one file" picker. It accepts, in the same dialog:

- **Local files** (drag-and-drop or file picker).
- **Pasted URLs** — the text box accepts *many URLs at once*, separated by space or newline. This is the "bulk URL" feature that shipped Aug 5, 2025 on web/desktop (not mobile).
- **Pasted text** — becomes a single "Copied Text" source.
- **Google Drive picker** — pick multiple Docs/Slides/Sheets at once (creates copies; Drive edits don't re-sync).
- **YouTube URL** — single video via the dedicated YouTube button, but *multiple YouTube links can be pasted into the generic URL field alongside web links*.
- **Deep Research / Fast Research** — an agent that browses the web and returns up to ~50 verified documents that can be imported into the notebook as sources in one action.

Everything that can be added lands in the same **Sources panel** on the left, as equal citizens, each with the same per-source affordances (select for grounding, rename, view summary, delete).

### 1.2 Exact source types and limits (verbatim)

**Supported source types:**
| Category | Formats |
|---|---|
| Documents | PDF, DOCX, TXT, MD, PPTX, CSV, ePub |
| Google Workspace | Docs, Slides (≤100 slides), Sheets (≤100k tokens) |
| Web | Any public URL (HTML text only — no images, embeds, nested pages; no paywalls) |
| Video | Public YouTube with captions, ≥72 hours old (transcript only) |
| Audio | MP3, WAV, M4A, AAC, OGG, OPUS, and ~15 others |
| Images | PNG, JPG, JPEG, WEBP, HEIC, TIFF, etc. |
| Text | Pasted text, Gemini Chats |

**Per-source hard limits (identical across tiers):**
- **500,000 words per source**
- **200 MB per uploaded file**
- **No page limit**
- PDFs that are copy-protected are rejected
- Audio with no speech is rejected
- YouTube: must be public, have captions, and be ≥72 hours old

**Quota limits (vary by tier):**
| Tier | Sources/notebook | Notebooks/user | Chat queries/day | Audio overviews/day |
|---|---|---|---|---|
| Free | 50 | 100 | 50 | 3 |
| Plus ($19.99) | 300 | 500 | 500 | 20 |
| Ultra ($249.99) | 600 | — | 5,000 | 200 |

### 1.3 The ingestion pipeline (what happens after upload)

Each added source goes through an async per-source pipeline. The Sources panel shows a spinner per row while processing. Stages (inferred + enterprise API confirms the terminal state):

1. **Acquire** — upload file to storage / fetch URL HTML / fetch YouTube captions / fetch Drive copy / transcribe audio.
2. **Parse** — extract raw text (OCR for scanned PDFs, transcript for audio/video, DOM-to-text for URLs).
3. **Clean** — strip boilerplate, normalize whitespace, keep page/section markers for citations.
4. **Chunk** — split into overlapping chunks (the public RAG breakdowns describe semantic/sentence-aware chunking with overlap; study-app already does 1000-char / 200-char overlap which is a reasonable default).
5. **Embed** — per-chunk vector via the embedding model.
6. **Index** — upsert to the vector store keyed by `(source_id, chunk_idx)`, plus keyword/BM25 index for hybrid retrieval.
7. **Summarize** — LLM generates the "source summary + key topics + suggested questions" shown in the preview.
8. **Mark complete** — status flips to `SOURCE_STATUS_COMPLETE`; row becomes selectable for grounding.

The Enterprise API exposes this pipeline as:
- `sources:batchCreate` — takes an array of `userContents` (one per source). Each item is one of `googleDriveContent`, `textContent`, `webContent`, `videoContent`, or (for files) a prior `sources:uploadFile` call.
- `sources:uploadFile` — raw binary POST with `X-Goog-Upload-File-Name` / `X-Goog-Upload-Protocol: raw` headers. Returns a `sourceId`.
- `sources:batchDelete` — array of resource names.

Each source response carries `metadata.wordCount`, `metadata.tokenCount`, and `settings.status`. There is **no documented job-polling endpoint**; the response appears to be the completion acknowledgement (i.e. the server blocks until processed, up to some timeout), or status is inferred from the next `get`. This matters for our design: we can't copy that exactly at scale — we need a real job queue.

### 1.4 Behavior details worth copying

- **Per-row status is the primary feedback surface.** A spinner per source row, not a single global progress bar. A failure on one source does not block the others from landing.
- **Summaries are generated after index completes**, so the row appears in a "processing" state, then a "ready" state where clicking opens the summary + topics + suggested questions.
- **Grounding checkboxes default to checked** for newly added sources — the user is expected to immediately chat with what they just added.
- **Renaming** is a client-side title update only; doesn't re-index.
- **Duplicates are not deduplicated** by Google — uploading the same PDF twice produces two sources. This is deliberate (user may want different titles / different pages selected).
- **Bulk URL paste is serial-ish and error handling is basic.** Community reports (XDA, onecooltip) note that one bad URL "may halt the rest or stall." We should do better: process in parallel with per-URL isolation.
- **Deep Research** is distinct — it produces a *report document* plus its cited sources, dumped in as one operation of up to ~50 sources.

### 1.5 Failure modes NotebookLM exposes to the user

From support threads and community troubleshooting posts:
- Copy-protected PDF → rejection at parse.
- File > 200 MB → rejection at upload.
- PDF uploaded to Drive <72h ago → transient failure, user told to retry.
- YouTube without captions / <72h old → rejection with a "caption required" message.
- Paywalled website → empty / near-empty text, source lands but is useless.
- Audio with no speech → rejection.
- Network-level failure → "Error uploading source, try again" generic toast.

The user-facing error vocabulary is small (~6 buckets). We should mirror that — precise enough to act on, not a stack trace.

---

## 2. Mapping to study-app

The codebase already has most of the primitives. The feature is mostly *composition and orchestration*, not new infrastructure.

### 2.1 What exists today (to reuse)

- **File upload:** UploadThing (`fileUpload`, `podcastAudio`, `blogImage` endpoints in [src/app/api/uploadthing/core.ts](src/app/api/uploadthing/core.ts)) + S3 presigned URLs for audio.
- **Parsers:** `PDFParser` (pdf-parse + pdf-poppler), `youtube-transcript`, Whisper transcription via [/api/audio/transcribe](src/app/api/audio/transcribe/route.ts).
- **Chunk + embed:** `chunkText()` (1000 char / 200 overlap) + `indexNoteContent()` writing to `NoteChunk` with a pgvector embedding column. Retrieval via `querySimilarChunks()` (`<=>` cosine).
- **Real-time progress:** Pusher server + `NoteProgressManager` publishing `{stage, progress, message}`, consumed by [use-pusher-progress.ts](src/hooks/use-pusher-progress.ts).
- **Quotas:** `User.usedPdfProcessingThisMonth`, `Subscription.*PerMonth` — per-month counters enforced before ingestion.
- **UI primitives:** `upload-text-modal.tsx`, `audio-upload-modal.tsx`, Radix `progress.tsx`, Sonner toasts, dashboard-refresh-context tracking in-flight notes.
- **Data model:** `Transcript` (raw), `Note` (derived), `NoteChunk` (vectors), `Folder`.

What's **missing**:
- No job queue (Inngest / BullMQ / QStash). Long-running per-source work currently rides on the HTTP request.
- No "multi-item ingestion" concept in the data model — everything is one transcript → one note.
- No URL / website parser.
- No generic "Source" abstraction that spans PDF / URL / YouTube / audio / text.

### 2.2 Terminology for this project

NotebookLM calls the thing a **source**. Our model today calls it a **transcript** but is PDF-centric. We will introduce a **Source** abstraction that sits above `Transcript`/`Note` — every row in the bulk upload queue is a Source, regardless of input type.

One Source maps to one `Transcript` (raw + cleaned text + metadata) and optionally one `Note` (generated study note) once processing finishes. The existing `Transcript` model is extended rather than replaced. Existing single-PDF flows become a degenerate 1-source batch.

---

## 3. UX pattern

### 3.1 Entry points

Three places, all opening the same modal:
1. **"Add sources" button** at the top of a folder / notebook view — primary path.
2. **Drag files onto the folder view** — modal opens pre-populated with those files.
3. **Deep link from an empty notebook state** ("Add your first sources").

### 3.2 The "Add sources" modal — structure

A single modal, tabbed **only implicitly** (file drop zone is always active; tabs are for URL / Paste text / YouTube / Audio record). Matches NotebookLM's "one dialog, mixed inputs."

```
┌─ Add sources ──────────────────────────────────[ x ]─┐
│                                                     │
│    ┌─────────────────────────────────────────────┐  │
│    │   Drop files here, or click to browse       │  │
│    │   PDF · DOCX · TXT · MD · PPTX · MP3 · …    │  │
│    └─────────────────────────────────────────────┘  │
│                                                     │
│   [ Link ]  [ YouTube ]  [ Paste text ]  [ Record ] │
│                                                     │
│   ── Queue (0) ────────────────────────────────     │
│   (rows appear here as user adds items)             │
│                                                     │
│                              [ Cancel ] [ Add N ]   │
└──────────────────────────────────────────────────────┘
```

**Key UX rules:**
- The queue is populated **before** clicking "Add N" — user can review, rename, remove rows first.
- Clicking "Link" opens a single multiline textarea. Space- and newline-separated URLs each become a row.
- Pasting a newline-separated list directly onto the drop zone **also** works — detect URL-ness.
- Pasting a YouTube URL in the generic Link tab is fine — auto-detected as a YouTube row.
- Mixed batches are allowed (3 PDFs + 2 URLs + 1 YouTube + pasted text) — single "Add" button submits them together.

### 3.3 Queue row — the atomic unit

Each row shows:
- **Icon** (type: PDF / URL / YT / Audio / Text / Drive / Image)
- **Title** (filename / URL hostname / YouTube video title once fetched / first 40 chars of pasted text)
- **Subtitle** (size, duration, or URL)
- **Status chip** with one of six states — *this vocabulary is what we commit to*:
  - `queued` — in the batch, not started
  - `uploading` — bytes moving (file only)
  - `processing` — parsing / transcribing / embedding
  - `ready` — indexed, selectable for chat
  - `failed` — with a 1-line reason + retry button
  - `skipped` — user removed or deduplicated
- **Right-side action:** Remove (before submit) / Retry (after fail) / View (after ready).

Per-row progress is a thin line under the row, not a big bar. The only global indicator is a counter: "3 of 7 ready · 1 failed".

### 3.4 After "Add N" is clicked

- Modal stays open, rows tick through states live via Pusher.
- User can close the modal at any time — work continues in the background; a floating tray ("Processing 5 sources") appears at the bottom-right until all are terminal (`ready` / `failed` / `skipped`).
- A source becomes **selectable for grounding** the moment it flips to `ready`. User doesn't have to wait for the whole batch.
- Failures don't block the batch. Each failed row has a "Retry" that re-runs *that source only*, not the whole batch.

### 3.5 Pre-submit validation (client-side)

Before hitting the server, strip/reject:
- Files > 200 MB (match NotebookLM) — row marked `failed` with "File too large" pre-upload.
- Unsupported extensions — reject at drop.
- URLs that fail basic regex.
- Exceeding the user's remaining quota — row marked `skipped` with "Plan limit reached; upgrade to add more." Show the cap near the Add button: "Adding 7 sources. You have 3 slots left this month on Free."

Also show a soft warning (not a block) when:
- The batch would put the user within 10% of their monthly quota.
- A URL looks like a known-paywalled domain (NYT, WSJ, etc.) — "may import as empty."

### 3.6 Progress semantics

Match NotebookLM's per-row-first, batch-second feedback. Concretely:
- Server emits per-source Pusher events on a channel keyed by `batchId`: `{sourceId, stage, progress, message}`.
- Stages a source may pass through, in order: `queued → uploading → parsing → chunking → embedding → summarizing → ready` (or `failed` with reason).
- Client maps these to the 6-state chip (collapsing `parsing + chunking + embedding + summarizing` into the single visible `processing`, but uses the fine-grained stage as tooltip text).

---

## 4. Data model

Additive changes to Prisma. No breaking changes to existing `Transcript` / `Note` flows.

### 4.1 New models

**`SourceBatch`** — one per "click Add N"
- `id` (cuid)
- `userId`
- `folderId` (nullable — batch can span before folder assignment)
- `status` — `pending | processing | completed | partial | failed`
- `totalCount`, `readyCount`, `failedCount`, `skippedCount`
- `createdAt`, `completedAt`

**`Source`** — one per queue row, the unified abstraction
- `id` (cuid)
- `batchId` → `SourceBatch`
- `userId`
- `folderId`
- `type` — enum `PDF | DOCX | TXT | MD | PPTX | CSV | EPUB | URL | YOUTUBE | AUDIO | IMAGE | TEXT | DRIVE`
- `status` — enum matching the 6-state vocabulary (`queued | uploading | processing | ready | failed | skipped`)
- `stage` — fine-grained: `queued | uploading | parsing | chunking | embedding | summarizing | ready | failed`
- `progress` (0–100)
- `errorCode` — `FILE_TOO_LARGE | UNSUPPORTED_FORMAT | COPY_PROTECTED | NO_CAPTIONS | NO_SPEECH | PAYWALL | FETCH_FAILED | PARSE_FAILED | QUOTA_EXCEEDED | INTERNAL` (matches NotebookLM's ~6 user-facing buckets, fleshed out)
- `errorMessage` (short, user-facing)
- `title` (derived or user-edited)
- `rawInput` (JSON — `{filename, size, mime}` or `{url}` or `{text}` depending on type)
- `uploadKey` (UploadThing key / S3 key, null for URL/text)
- `wordCount`, `tokenCount` (populated post-parse, match NotebookLM fields)
- `transcriptId` → existing `Transcript` (nullable until ready)
- `noteId` → existing `Note` (nullable; optional — for auto-generated study note)
- `summary`, `keyTopics` (string[]), `suggestedQuestions` (string[]) — generated post-index, stored JSON
- `createdAt`, `updatedAt`, `readyAt`

**Indexes:** `(batchId)`, `(userId, status)`, `(folderId, status)`.

### 4.2 Existing models — minimal touch

- `Transcript` gains optional `sourceId` back-reference.
- `NoteChunk` gains optional `sourceId` (nullable to preserve old rows); retrieval can scope queries to a folder by joining through Source → Folder.
- `User` / `Subscription` quota fields reused as-is; add `usedSourcesThisMonth` counter bumped on each successful `ready`.

---

## 5. Backend architecture

### 5.1 The contract

Two endpoints, plus a webhook:

**`POST /api/sources/batch`** — create a batch + N Sources, enqueue jobs.
```
Request:
{
  folderId: string | null,
  items: Array<
    | { kind: "file",    uploadKey: string, filename: string, size: number, mime: string }
    | { kind: "url",     url: string }
    | { kind: "youtube", url: string }
    | { kind: "text",    title?: string, content: string }
    | { kind: "drive",   documentId: string, mimeType: string, name: string }
  >
}
Response:
{
  batchId: string,
  sources: Array<{ id, type, status: "queued" | "skipped", errorCode? }>,
  pusherChannel: string  // "batch-${batchId}"
}
```

Files are uploaded to UploadThing/S3 **before** this endpoint is called (client-side signed upload), and only the `uploadKey` comes back. This keeps the batch-create call fast and avoids streaming bytes through a Next.js route handler.

**`POST /api/sources/:id/retry`** — re-enqueues a single failed Source. Idempotent.

**`POST /api/sources/:id/cancel`** — moves a `queued` or `processing` row to `skipped`.

### 5.2 Job execution

Next.js API routes time out (Vercel: 10s hobby, 60s Pro, 300s via `maxDuration` on Fluid). A 200 MB PDF + embeddings is not going to fit. Options, in order of preference:

1. **QStash** or **Inngest** — fire-and-forget HTTP jobs, retries + visibility built in. Recommended; minimal infra.
2. **Vercel Cron + a work table** — poll `Source` rows where `status = queued`. Works but the latency is poor.
3. **A small Node worker on Render/Fly** — read from the same Postgres, no new vendor. Most work, most control.

**Recommendation: QStash** (or Inngest) for the job fan-out, because:
- We already run serverless (no always-on process).
- Each source is its own job — natural fan-out model.
- Retries + DLQ are first-class.
- Fits the existing Pusher-for-progress pattern: worker does the work, Pusher tells the UI.

One job per Source. The batch is just a grouping for UX; jobs don't depend on each other.

### 5.3 Per-source pipeline (inside the job)

```
  dispatch by Source.type
     │
     ├─ FILE (PDF/DOCX/TXT/MD/PPTX/CSV/EPUB) 
     │    → fetch from UploadThing/S3
     │    → route to parser by mime
     │    → parser returns { text, pageMarkers[], metadata }
     │
     ├─ URL  → fetch HTML → readability/text extract → warn on paywall patterns
     ├─ YOUTUBE → youtube-transcript → concat with timestamps
     ├─ AUDIO → Whisper → transcript + speaker turns (optional)
     ├─ IMAGE → Gemini Vision OCR → text
     ├─ DRIVE → Drive API export to PDF/DOCX → route to parser
     ├─ TEXT → pass-through
     │
     ▼
  normalize (strip nbsp, collapse whitespace, retain markers)
     │
     ▼
  validate (≥1 word; ≤500k words; reject otherwise)
     │
     ▼
  chunk (reuse chunkText, 1000/200)
     │
     ▼
  embed in parallel (batch size ≈ 20 per OpenAI call; retry with backoff)
     │
     ▼
  upsert NoteChunks keyed by (sourceId, idx)
     │
     ▼
  summarize (LLM call: short summary + ≤5 key topics + ≤5 suggested questions)
     │
     ▼
  mark ready, emit Pusher, increment quota counter
```

Each arrow is a point at which we emit a Pusher event bumping `stage`/`progress`.

### 5.4 Concurrency, backpressure, idempotency

- **Per-user cap:** at most **5 sources processing concurrently** per user, across batches. Extra sources sit in `queued`. This protects OpenAI rate limits and prevents one abusive batch from starving others.
- **Per-batch fairness:** round-robin when releasing from the queue, not FIFO, so a 50-item batch doesn't block a later 1-item batch indefinitely.
- **Idempotency key:** job carries `(sourceId, attempt)`. Parser/embedder writes are upserts keyed by `(sourceId, chunkIdx)` so a retry after a partial run doesn't duplicate chunks.
- **Deduplication within a batch:** optional. Match NotebookLM's default — *don't dedupe*. But do surface "this URL is already in this folder" as a soft warning before submit.
- **Embeddings cost control:** skip embedding for sources > 500k words at the validation stage before paying for chunks.

### 5.5 Rate limit strategy vs external APIs

- OpenAI embeddings: batch 20 chunks per call, exponential backoff on 429 (1s → 2s → 4s → 8s; 5 attempts then fail the source).
- Whisper: one file per call; 30s timeout per attempt; 3 attempts.
- YouTube transcript: 2 attempts then fail with `NO_CAPTIONS` if second failure is a known captions-missing error, else `FETCH_FAILED`.
- URL fetch: 1 attempt, 15s timeout; 302/301 followed up to 3 hops.

---

## 6. Error handling — the user-facing vocabulary

Map every server-side failure into **one of these six buckets**, exactly:

| errorCode | User message | When |
|---|---|---|
| `FILE_TOO_LARGE` | "File is over 200 MB. Split it into parts." | Pre-upload size check, or S3/UT rejection. |
| `UNSUPPORTED_FORMAT` | "We don't support this file type yet." | Mime not in allowlist, or PDF is copy-protected. |
| `NO_CONTENT` | "We couldn't find readable text. Audio with no speech, a paywalled page, or a captionless video will fail." | Post-parse word count < 20; one message covers paywall/no-speech/no-captions. |
| `FETCH_FAILED` | "Couldn't reach this source. Try again." | URL 5xx/timeout, Drive permission, UT download error. |
| `QUOTA_EXCEEDED` | "You've used all your source slots this month. Upgrade to add more." | Server-side quota check. |
| `INTERNAL` | "Something went wrong on our end. Retry, or try again later." | Everything else — caught exception. |

Why six: matches the user's actual decision tree (*do I split? swap formats? pay? try another URL? wait?*). More granularity is information the user can't act on.

---

## 7. Quotas, billing, and caps

- Enforce at three gates:
  1. **Client-side pre-submit** — show the cap next to "Add N", strip over-cap rows to `skipped`.
  2. **Server batch-create** — double-check; if over, return `skipped` rows with `QUOTA_EXCEEDED` so the UI lines up.
  3. **Inside the job, before `ready`** — decrement the counter atomically; if the counter is already 0 (race), fail with `QUOTA_EXCEEDED`.
- Mirror NotebookLM's plan shape without copying prices: per-notebook source cap, per-user notebook cap, per-month ingestion cap. The existing `Subscription` model already has per-month counters — `usedPdfProcessingThisMonth` generalizes to `usedSourcesThisMonth`.

---

## 8. Phasing

Small enough steps that each ships standalone.

**Phase 1 — Foundation (no UI yet).**
- Add `Source`, `SourceBatch`, enums, migrations.
- Add the batch-create API + per-source job runner for the **existing** types only (PDF, text). Wire to QStash/Inngest.
- Per-source Pusher events.
- Unit tests on the pipeline state machine.

**Phase 2 — New parsers.**
- URL fetch + extract.
- YouTube transcript.
- Audio (route through existing Whisper pipeline).
- DOCX / TXT / MD / PPTX.

**Phase 3 — Bulk UI.**
- New "Add sources" modal with queue + drag-drop + URL paste + YouTube + text.
- Floating processing tray.
- Per-row retry + cancel.

**Phase 4 — Polish.**
- Drive picker.
- Image OCR.
- Deep-Research-style "find sources for this topic" agent (uses an LLM + search API to bulk-populate the queue).
- Source folders / bulk move.

Phases 1 + 2 are backend only, deployable behind a flag. Phase 3 is when the user sees the change.

---

## 9. Risks and open questions

- **Job runner choice** — QStash vs Inngest vs a worker. Default recommendation: QStash for simplicity, but team should verify it fits retention/observability needs. The design doesn't depend on which we pick.
- **PDF OCR for scanned PDFs** — current `PDFParser` may not OCR. Needs verification; if not, add Gemini Vision fallback when extracted text < 100 chars / page avg.
- **Pgvector at scale** — 600 sources × ~500 chunks/source × 1536 dims is ~460k vectors per notebook. pgvector with HNSW handles this, but index build time on existing hot tables should be measured before a Phase 3 launch.
- **Cost ceiling per batch** — a 50-source batch of 500k-word PDFs is expensive to embed. Either cap per-batch word count, or require Plus/Pro to go above some threshold.
- **Source preview content** — NotebookLM's auto-summary + key topics + suggested questions is a whole separate generation call per source. We may defer it to on-demand (lazy, when the user clicks the row) to cut upfront cost. Behavior-identical to the user; ~30% cheaper.
- **Do we dedupe?** Recommend "warn, don't block" in v1, matching NotebookLM.
- **Mobile** — NotebookLM doesn't ship bulk paste on mobile yet. We should; mobile users pasting a share-sheet URL into our app is a core case.

---

## 10. Sources

Research base for this document:

- [NotebookLM Help: Add or discover new sources](https://support.google.com/notebooklm/answer/16215270?hl=en&co=GENIE.Platform%3DDesktop)
- [NotebookLM Help: FAQ](https://support.google.com/notebooklm/answer/16269187?hl=en)
- [NotebookLM Enterprise API: Data sources](https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks-sources)
- [Google Blog: Deep Research and new file types](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/)
- [XDA: NotebookLM bulk URL feature (Aug 2025)](https://www.xda-developers.com/notebooklm-bulk-url-feature/)
- [OneCoolTip: How to bulk upload URLs in NotebookLM](https://www.onecooltip.com/2025/08/how-to-bulk-upload-urls-in-notebooklm.html)
- [Elephas: NotebookLM source limits explained](https://elephas.app/blog/notebooklm-source-limits)
- [NotebookLM Tools features](https://www.nlmtools.com/features)
- [NotebookLM Web Importer (Chrome)](https://chromewebstore.google.com/detail/notebooklm-web-importer/ijdefdijdmghafocfmmdojfghnpelnfn?hl=en)
- [Behind NotebookLM: RAG pipeline breakdown](https://ai.plainenglish.io/behind-notebook-lm-how-ai-turns-information-into-insight-437b8054d8a5)
- [Open Notebook — open-source NotebookLM clone](https://github.com/lfnovo/open-notebook)
- [Tubarks: Fix NotebookLM source errors](https://tubarksblog.com/2025/05/04/how-to-fix-notebooklm-source-errors-simple-workarounds-that-work/)
