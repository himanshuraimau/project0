# Flinote

Flinote is an AI-powered study platform that turns lectures, PDFs, YouTube videos, audio recordings, and web links into organized study material. Students and professionals use it to capture content once and get notes, flashcards, quizzes, mind maps, podcasts, and structured courses from the same sources.

Production site: [https://flinote.ai](https://flinote.ai)

## What it does

- **Smart notes** — Upload or link content (PDF, audio, video, URLs, pasted text) and generate rich, structured notes with AI.
- **Study tools** — Auto-generate flashcards, quizzes, and mind maps from your notes.
- **AI chat** — Ask questions about your study material in context.
- **Podcasts** — Turn notes into listenable AI-generated podcasts.
- **Courses** — Build multi-chapter courses with units, chapters, and progress tracking.
- **Folders & sharing** — Organize notes in folders and share via public links.
- **Translations** — Support for many languages on notes and content.
- **Subscriptions** — Free tier with limits; Pro for unlimited usage (web via Paddle, mobile via RevenueCat).

The product ships as a **web app** and a **native mobile app** (iOS and Android) that share the same backend and database.

## Repository structure

| Path | Description |
|------|-------------|
| `web/` | Next.js web application — marketing site, dashboard, API routes, Prisma database, auth, billing webhooks, and admin tools. This is the main backend. |
| `mobile/` | Expo (React Native) app — onboarding, notes, study features, and in-app purchases via RevenueCat. |
| `docs/` | Internal documentation (e.g. payments on web vs mobile). |
| `prompts.md` | Collection of AI prompts used for course, note, quiz, and flashcard generation. |

Additional setup and implementation guides live at the repo root:

- `QUICK_START_GUIDE.md` — Database, API keys, and billing setup
- `API_KEYS_SETUP_GUIDE.md` — Paddle, RevenueCat, and related credentials
- `BILLING_IMPLEMENTATION_STATUS.md` — Subscription architecture overview

## Tech stack (high level)

**Web (`web/`)**

- Next.js (App Router), React, TypeScript
- PostgreSQL (Neon) with Prisma
- Better Auth (sessions, social sign-in including Apple)
- AI SDK (OpenAI, Google) for generation
- Paddle (web subscriptions), webhooks for RevenueCat (mobile sync)
- AWS S3 for audio/uploads, Pusher for realtime progress, UploadThing for file uploads

**Mobile (`mobile/`)**

- Expo Router, React Native, TypeScript
- Better Auth Expo client (same auth as web)
- RevenueCat for App Store / Play Store subscriptions

## Getting started

1. **Web** — Copy `web/.env.example` to `web/.env`, fill in database and API keys, then:

   ```bash
   cd web
   npm install   # or bun install
   npx prisma migrate deploy
   npm run dev
   ```

2. **Mobile** — Configure `mobile/.env` (API URL, RevenueCat keys, etc.), then:

   ```bash
   cd mobile
   npm install
   npx expo start
   ```

See `QUICK_START_GUIDE.md` and `API_KEYS_SETUP_GUIDE.md` for billing, webhooks, and third-party service setup.

## Who it's for

Students, self-learners, teachers, parents, and working professionals who want faster note-taking, better retention, and study tools generated from the material they already have.
