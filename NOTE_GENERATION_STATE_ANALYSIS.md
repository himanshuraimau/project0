# Note Generation Loading State Bug Analysis

## 1. Overview

This document analyzes the full state flow for note generation, identifies the root cause
of the bug where loading state persists alongside a completed note after page refresh or
navigation, and proposes a clean state model to resolve the issue.

---

## 2. Architecture Summary

The note generation loading state is managed by **four interacting layers**:

| Layer | File | Role |
|-------|------|------|
| Global Context | `contexts/dashboard-refresh-context.tsx` | Manages `loadingNotes[]` array, persists to `localStorage` |
| Pusher Client | `lib/realtime/pusher-client.ts` | Real-time WebSocket bridge; in-memory event cache per job |
| Pusher Hook | `hooks/use-pusher-progress.ts` | React hook binding Pusher events to component state |
| UI Components | `components/notes/generating-note-card.tsx`, `notes-list.tsx` | Renders progress bar, triggers cleanup |

---

## 3. Complete State Flow

### 3.1 Initiation

When a user triggers note generation (PDF upload, audio recording, YouTube/webpage link,
or text input), the following happens in the respective modal component
(e.g., `upload-text-modal.tsx`, `add-link-modal.tsx`, `new-note-section.tsx`):

1. A temporary ID is created: `const tempId = `pdf-${Date.now()}``
2. `addLoadingNote(tempId, type, "uploading")` is called on the Dashboard context.
3. The modal closes after a 300ms delay.
4. The API request begins. `updateLoadingNote(tempId, { stage: "processing" })` is called
   as the request progresses through stages.
5. For PDF uploads, `progressJobId: tempId` is sent to the API route.

### 3.2 Server-Side Progress Publishing

In the API route (`api/pdf/process-from-url/route.ts`):

1. `publishProgress()` calls `noteProgressManager.publish()` at key milestones
   (15% uploading → 40% processing → 60-75% generating → 100% completed).
2. `NoteProgressManager.publish()` triggers Pusher server events on channel
   `"note-progress"` with event name `note-${jobId}`.
3. The `progressJobId` is persisted in the transcript's metadata for post-refresh cleanup.

### 3.3 Client-Side Real-Time Updates

`GeneratingNoteCard` subscribes via `usePusherProgress` → `subscribeToPusherProgress()`.
A shared Pusher channel `"note-progress"` handles all jobs with per-job event bindings.
Events are cached in an in-memory `lastEvents` map for replay on component remount.

When a Pusher event arrives:
- `onProgress` → `updateLoadingNote(id, { stage, progress, message })` syncs to context.
- `onCompleted` → `updateLoadingNote(stage: 'completed')`, then `removeLoadingNote(id)`
  after 500ms, plus `cleanupPusherJob(jobId)`.
- `onError` → `updateLoadingNote(id, { stage: 'error', error })`.

### 3.4 Context Persistence (localStorage)

`DashboardRefreshProvider` syncs `loadingNotes` to `localStorage` under key
`dashboard_loading_notes`:

- **On mount**: reads from localStorage, filters out stale entries:
  - Notes older than 1 hour
  - Notes in `"completed"` stage
  - Notes stuck in `"generating"/"processing"/"uploading"` for >10 minutes
  - Error notes older than 5 minutes
- **On change**: writes current `loadingNotes` to localStorage.
- **On removal**: immediately updates localStorage before state update.
- **On completion**: immediately removes from localStorage, then removes from state
  after 500ms.

### 3.5 Cleanup Mechanisms in NotesList

`NotesList` has three cleanup strategies:

1. **On notes fetch**: removes loading notes that are >30min old, completed, or have a
   `noteId`/`progressJobId`/`transcriptId` matching a DB note or transcript.
2. **Recovery polling**: if loading notes exist, polls `loadNotes()` every 10 seconds.
3. **Immediate cleanup effect**: runs when `notes` or `loadingNotes` change, performing
   the same ID matching logic for cleanup on navigation return.

---

## 4. The Bug: What Goes Wrong on Refresh

### 4.1 Symptom

After refreshing or navigating away and returning:
- Progress resets to 0%.
- The loading card (GeneratingNoteCard) is visible.
- The completed note is also visible in the list.
- Both render simultaneously.

### 4.2 Root Cause Analysis

The bug is caused by **a timing gap between localStorage rehydration and cleanup**, combined
with **loss of in-memory Pusher state on refresh** and **incomplete ID linkage across
different generation flows**.

#### Problem 1: localStorage Rehydration Restores Active-Looking Loading Notes

When the page refreshes, `DashboardRefreshProvider.useEffect` reads from localStorage.
The filter logic allows notes through if they:
- Are less than 1 hour old.
- Are NOT in `"completed"` stage.
- Have been active within the last 10 minutes.

If the note was completed successfully and `removeLoadingNote` or `updateLoadingNote(stage: 'completed')`
ran *before* the refresh, localStorage is clean. But there are multiple scenarios where
this does NOT happen:

- **The user refreshes during generation**: the note is still in `"generating"` stage.
  After generation completes on the server, the Pusher `"completed"` event fires, but
  no client is listening (page is reloading). localStorage still has the loading note
  in `"generating"` stage.

- **Race condition on completion**: `updateLoadingNote(stage: 'completed')` eagerly
  cleans localStorage, but if the page unmounts between the context state update and
  the `setTimeout(() => removeFromState, 500)`, the state may be written back to
  localStorage by the persistence effect before the removal fires.

#### Problem 2: Progress Resets to 0 After Refresh

`usePusherProgress` stores `latestEvent` in React state (in-memory). On refresh,
this is `null`. The `GeneratingNoteCard` computes `targetPercent` using a priority chain:

```
socketProgress (from Pusher hook) → persistedProgress (from loadingNote.progress) → 0
```

After refresh:
- `socketProgress` is `null` (no Pusher event received yet).
- `persistedProgress` depends on whether `updateLoadingNote` was called with the latest
  progress before the refresh. If the last update wrote progress (e.g., 75%), it would
  show 75%. But if the loading note was created and no progress update was persisted
  before refresh, it defaults to `0`.

For non-PDF flows (audio, YouTube, webpage), progress is often NOT updated via Pusher
because `progressJobId` is not passed to those API routes. These flows update the context
directly from the modal component. If the modal was already closed and the API is
processing server-side, no further progress updates reach the client before completion.

#### Problem 3: Dual Rendering of Loading Card and Completed Note

After refresh, two things happen in parallel:

1. `DashboardRefreshProvider` restores loading notes from localStorage → `loadingNotes`
   has entries → `GeneratingNoteCard` renders.
2. `NotesList` calls `loadNotes()` → fetches from API → finds completed note → renders
   `NoteCard`.

Both render simultaneously. The cleanup mechanisms in `NotesList` only run *after*
the notes fetch completes, and they depend on ID matching.

#### Problem 4: ID Matching Gaps

The cleanup in `NotesList` tries to match loading notes to DB notes using three strategies:

| Strategy | Condition | Works For |
|----------|-----------|-----------|
| `noteId` match | `loadingNote.noteId` exists in fetched notes | Flows that set `noteId` before removal |
| `progressJobId` match | `loadingNote.id` found in transcript metadata | PDF flow only (others don't pass `progressJobId`) |
| `transcriptId` match | `loadingNote.transcriptId` matches a transcript with notes | Flows that set `transcriptId` before removal |

**For non-PDF flows** (YouTube, webpage, audio):
- `progressJobId` is never stored in transcript metadata.
- `noteId` is set only if the API returns synchronously before the modal updates.
- `transcriptId` may or may not be set depending on when the update happened.

If none of these IDs match, the loading note persists until the 10-minute safety timeout.

---

## 5. Detailed Component Interaction Diagram

```
User Action (Upload PDF / Record Audio / Paste Link / Enter Text)
    │
    ├──► addLoadingNote(tempId, type) ──► DashboardRefreshContext
    │                                       │
    │                                       ├──► loadingNotes state updated
    │                                       └──► localStorage written
    │
    ├──► API Request (with progressJobId for PDF)
    │       │
    │       ├──► Server: noteProgressManager.publish()
    │       │       │
    │       │       └──► Pusher Server: trigger("note-progress", event)
    │       │               │
    │       │               └──► Pusher Client: event received
    │       │                       │
    │       │                       └──► usePusherProgress hook
    │       │                               │
    │       │                               ├──► onProgress → updateLoadingNote()
    │       │                               ├──► onCompleted → updateLoadingNote(completed)
    │       │                               │                   → removeLoadingNote() [500ms]
    │       │                               │                   → cleanupPusherJob()
    │       │                               └──► onError → updateLoadingNote(error)
    │       │
    │       └──► API Response returns to modal component
    │               │
    │               ├──► updateLoadingNote(noteId, stage: completed)
    │               └──► removeLoadingNote(tempId)
    │
    └──► NotesList renders
            │
            ├──► GeneratingNoteCard (for each loadingNote)
            │       └──► usePusherProgress(jobId) for real-time updates
            │
            └──► NoteCard (for each DB note)
                    └──► Cleanup effects match loading notes to DB notes
```

### On Page Refresh

```
Page Load
    │
    ├──► DashboardRefreshProvider mounts
    │       └──► Reads localStorage → Filters → Sets loadingNotes state
    │           (loading notes with non-completed stage survive)
    │
    ├──► NotesList mounts
    │       ├──► Calls loadNotes() → fetches from API
    │       │       └──► Completed note appears in response
    │       │
    │       ├──► Renders GeneratingNoteCard (from restored loadingNotes)
    │       │       └──► usePusherProgress subscribes but gets NO cached events
    │       │           (Pusher in-memory cache lost on refresh)
    │       │           → socketProgress = null → falls back to persistedProgress
    │       │           → persistedProgress = 0 or stale value → progress shows 0%
    │       │
    │       └──► Renders NoteCard (from API response)
    │               └──► BOTH loading card AND note card visible simultaneously
    │
    └──► Cleanup effects eventually fire
            └──► If IDs match → removeLoadingNote (delayed)
                 If IDs don't match → loading card persists until timeout
```

---

## 6. Proposed Fix: Clean State Model

### 6.1 Core Principle

**A single source of truth for "is this note still generating?"** should be the database,
not localStorage. localStorage should only be used as a short-lived cache to avoid
UI flicker, not as a source of truth that can outlive the actual generation process.

### 6.2 Proposed Changes

#### Change 1: Always Set `noteId` and `transcriptId` on Loading Notes

All generation flows (not just PDF) should consistently set `transcriptId` and `noteId`
on the loading note as soon as these IDs become available from the API response.
This enables reliable cleanup matching.

**Files to modify:**
- `components/link/add-link-modal.tsx`
- `components/audio/audio-upload-modal.tsx`
- `components/audio/record-audio.tsx`
- `components/dashboard/new-note-section.tsx` (AudioRecorderModal)

#### Change 2: Aggressive Cleanup on Rehydration

In `DashboardRefreshProvider`, mark rehydrated notes with a `rehydrated: true` flag.
`NotesList` should perform an immediate cleanup fetch on mount and not render rehydrated
loading cards until the fetch confirms the note is still in-progress.

#### Change 3: Add a `completedAt` Timestamp to Loading Notes

Set `completedAt` on completion. During rehydration, filter out any note where
`completedAt` is set, providing a safety net beyond the stage check.

#### Change 4: Clear Loading Notes from localStorage on `completed` Synchronously

Remove from localStorage and React state immediately on completion (no 500ms delay).
The "show 100%" animation should be handled in the UI component without keeping the
loading note in global state.

#### Change 5: Deduplicate Rendering in NotesList

Add a guard in `NotesList` rendering logic: if a loading note's `noteId`, `transcriptId`,
or `progressJobId` matches any fetched note, skip rendering the `GeneratingNoteCard`:

```typescript
const activeLoadingNotes = loadingNotes.filter(ln => {
  if (ln.noteId && noteIds.has(ln.noteId)) return false;
  if (progressJobIds.has(ln.id)) return false;
  if (ln.transcriptId && transcriptIds.has(ln.transcriptId)) return false;
  if (ln.stage === 'completed') return false;
  return true;
});
```

This provides an immediate visual fix even if state cleanup is slightly delayed.

#### Change 6: Pass `progressJobId` for All Generation Flows

Currently only the PDF flow passes `progressJobId` to the API. Extend this to YouTube,
webpage, and audio flows so the server can publish Pusher progress events and the
`progressJobId` can be stored in transcript metadata for reliable post-refresh cleanup.

---

## 7. State Lifecycle (Proposed Clean Model)

```
IDLE
  │
  ├─ User triggers generation
  │
  ▼
LOADING (in DashboardRefreshContext + localStorage)
  │  - id: tempId
  │  - stage: uploading → processing → generating
  │  - progress: updated via Pusher OR direct context updates
  │  - transcriptId: set when available
  │  - noteId: set when available
  │
  ├─ Pusher "completed" event received
  │     └─ removeLoadingNote(id) IMMEDIATELY
  │        localStorage cleared synchronously
  │
  ├─ API response returns with note data
  │     └─ removeLoadingNote(id) IMMEDIATELY
  │        localStorage cleared synchronously
  │
  ├─ Page refresh during generation
  │     └─ Rehydrate from localStorage
  │        Mark as "rehydrated"
  │        NotesList cleanup runs immediately:
  │          If note exists in DB → remove loading note
  │          If note doesn't exist → keep loading, resubscribe to Pusher
  │
  ├─ Page refresh after completion
  │     └─ localStorage already clean (cleared on completion)
  │        Nothing to rehydrate → only DB note renders
  │
  ▼
COMPLETE (loading note removed, only NoteCard renders)
```

---

## 8. Summary of Root Causes

| # | Root Cause | Impact |
|---|-----------|--------|
| 1 | localStorage rehydration does not verify against database | Stale loading notes survive refresh |
| 2 | Pusher in-memory cache lost on refresh | Progress resets to 0 |
| 3 | Non-PDF flows don't pass `progressJobId` | Cleanup cannot match loading notes to transcripts |
| 4 | `noteId`/`transcriptId` not consistently set across all flows | ID-based cleanup fails for some flows |
| 5 | 500ms delay before removing completed notes from state | Race window for stale state persistence |
| 6 | No rendering guard in NotesList | Loading card and note card render simultaneously |
| 7 | Completion stage removed from localStorage but re-persisted by effect | Race between cleanup and persistence effect |

---

## 9. Files Requiring Changes

| File | Change |
|------|--------|
| `contexts/dashboard-refresh-context.tsx` | Synchronous cleanup on completion; `completedAt` field; render-guard helper |
| `components/notes/notes-list.tsx` | Filter `loadingNotes` before rendering; immediate cleanup on mount |
| `components/notes/generating-note-card.tsx` | Handle rehydrated state; decouple animation from global state |
| `components/link/add-link-modal.tsx` | Set `transcriptId`/`noteId` consistently; pass `progressJobId` |
| `components/audio/audio-upload-modal.tsx` | Set `transcriptId`/`noteId` consistently; pass `progressJobId` |
| `components/dashboard/new-note-section.tsx` | Set `transcriptId`/`noteId` consistently in AudioRecorderModal |
| `components/pdf/upload-text-modal.tsx` | Already passes `progressJobId` (reference implementation) |
| `hooks/use-pusher-progress.ts` | No changes needed |
| `lib/realtime/pusher-client.ts` | No changes needed |
| `lib/note-progress-manager.ts` | No changes needed |

---

## 10. Conclusion

The core issue is that **localStorage acts as a source of truth that outlives the actual
generation process**. The Pusher real-time layer handles the happy path well, but on
refresh, the system falls back to localStorage which contains stale entries that the
cleanup mechanisms cannot reliably match back to database records.

The fix requires:
1. **Consistent ID propagation** across all generation flows.
2. **Synchronous state cleanup** on completion (no delayed removal).
3. **Defensive rendering** that filters out loading notes when matching DB notes exist.
4. **Database verification** during rehydration rather than trusting localStorage alone.

These changes ensure that after refresh, only the completed note is shown, and no stale
loading state persists in the UI.
