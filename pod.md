# Complete Next.js Integration Guide

This guide shows you **exactly** how to integrate the Podcast Microservice into your Next.js app, including webhooks, API routes, frontend components, and local testing.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
   - [Webhook Endpoint](#webhook-endpoint)
   - [API Routes](#api-routes)
5. [Frontend Implementation](#frontend-implementation)
6. [Local Testing](#local-testing)
7. [Production Deployment](#production-deployment)

---

## Prerequisites

### What You Need

- ✅ Next.js app (App Router or Pages Router)
- ✅ Database (Prisma, MongoDB, or any DB)
- ✅ Podcast microservice running (this repo)
- ✅ ngrok (for local webhook testing)

### Microservice Setup

Make sure your microservice is running:

```bash
cd /path/to/podnex-proto
bun install
bun run dev  # Runs on http://localhost:3005
```

---

## Environment Setup

### 1. Next.js App Environment Variables

Create or update your `.env.local`:

```env
# Podcast Microservice
PODCAST_API_URL=http://localhost:3005/api/podcast
PODCAST_API_KEY=your-api-key-here

# Webhook Security (use a strong random string)
WEBHOOK_SECRET=your-webhook-secret-key-here

# For production
# PODCAST_API_URL=https://your-microservice.com/api/podcast
```

### 2. Microservice Environment Variables

Update your microservice `.env`:

```env
# ... other variables ...

# Webhook Configuration (OPTIONAL)
WEBHOOK_URL=http://localhost:3000/api/webhooks/podcast-complete
WEBHOOK_SECRET=your-webhook-secret-key-here

# For local testing with ngrok
# WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/podcast-complete
```

**Note:** Webhooks are **optional**. The microservice works fine without them, but webhooks provide better UX.

---

## Database Schema

### Option A: Prisma

Add to your `schema.prisma`:

```prisma
model Podcast {
  id            String   @id @default(cuid())
  noteId        String   @unique
  userId        String
  
  // Podcast data
  podcastId     String   // ID from microservice
  audioUrl      String
  duration      Int      // in seconds
  transcript    Json
  
  // Status tracking
  status        String   // 'generating' | 'completed' | 'failed'
  error         String?
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId])
  @@index([noteId])
  @@index([status])
}
```

Then run:
```bash
npx prisma migrate dev --name add_podcast_model
```

### Option B: MongoDB (Mongoose)

```typescript
// models/Podcast.ts
import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema({
  noteId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  podcastId: { type: String, required: true },
  audioUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  transcript: { type: Array, required: true },
  status: { 
    type: String, 
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  error: { type: String },
}, { timestamps: true });

export const Podcast = mongoose.models.Podcast || mongoose.model('Podcast', podcastSchema);
```

### Option C: No Database

If you don't want to store podcasts in your DB, you can skip this and just use the microservice's database directly via API calls.

---

## Backend Implementation

### Webhook Endpoint

Create: `app/api/webhooks/podcast-complete/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Your database client

export async function POST(request: Request) {
  try {
    // 1. Verify webhook secret for security
    const secret = request.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      console.error('❌ Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse webhook payload
    const payload = await request.json();
    console.log('📥 Webhook received:', payload.event, payload.jobId);

    // 3. Handle completion event
    if (payload.event === 'podcast.completed') {
      // Save to YOUR database
      await db.podcast.upsert({
        where: { noteId: payload.noteId },
        create: {
          noteId: payload.noteId,
          userId: payload.userId,
          podcastId: payload.podcastId,
          audioUrl: payload.audioUrl,
          duration: payload.audioDuration,
          transcript: payload.transcript,
          status: 'completed',
        },
        update: {
          podcastId: payload.podcastId,
          audioUrl: payload.audioUrl,
          duration: payload.audioDuration,
          transcript: payload.transcript,
          status: 'completed',
          error: null,
        },
      });

      console.log(`✅ Podcast saved for note ${payload.noteId}`);

      // Optional: Send push notification to user
      // await sendNotification(payload.userId, {
      //   title: 'Podcast Ready!',
      //   body: 'Your podcast is ready to listen',
      //   data: { noteId: payload.noteId, audioUrl: payload.audioUrl }
      // });
    }

    // 4. Handle failure event
    else if (payload.event === 'podcast.failed') {
      await db.podcast.upsert({
        where: { noteId: payload.noteId },
        create: {
          noteId: payload.noteId,
          userId: payload.userId,
          status: 'failed',
          error: payload.error,
        },
        update: {
          status: 'failed',
          error: payload.error,
        },
      });

      console.error(`❌ Podcast failed for note ${payload.noteId}: ${payload.error}`);

      // Optional: Notify user of failure
      // await sendNotification(payload.userId, {
      //   title: 'Podcast Generation Failed',
      //   body: 'Please try again',
      // });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### API Routes

#### 1. Generate Podcast (Async)

Create: `app/api/podcast/generate/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PODCAST_API_URL = process.env.PODCAST_API_URL;
const PODCAST_API_KEY = process.env.PODCAST_API_KEY;

export async function POST(request: Request) {
  try {
    const { noteId, noteContent, userId, duration = 'short' } = await request.json();

    // Validate input
    if (!noteId || !noteContent || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create initial database record
    await db.podcast.create({
      data: {
        noteId,
        userId,
        status: 'generating',
      },
    });

    // Call microservice async endpoint (returns instantly!)
    const response = await fetch(`${PODCAST_API_URL}/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PODCAST_API_KEY!,
      },
      body: JSON.stringify({
        noteId,
        noteContent,
        userId,
        duration,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start podcast generation');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      jobId: data.jobId,
      status: data.status,
      message: 'Podcast generation started',
    });
  } catch (error: any) {
    console.error('Generate podcast error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate podcast' },
      { status: 500 }
    );
  }
}
```

#### 2. Check Job Status

Create: `app/api/podcast/status/[jobId]/route.ts`

```typescript
import { NextResponse } from 'next/server';

const PODCAST_API_URL = process.env.PODCAST_API_URL;

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Check job status from microservice
    const response = await fetch(`${PODCAST_API_URL}/jobs/${jobId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get job status');
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}
```

#### 3. Get User's Podcasts

Create: `app/api/podcast/user/[userId]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Get from YOUR database
    const podcasts = await db.podcast.findMany({
      where: { 
        userId,
        status: 'completed' // Only return completed podcasts
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        noteId: true,
        audioUrl: true,
        duration: true,
        transcript: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, podcasts });
  } catch (error: any) {
    console.error('Get user podcasts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get podcasts' },
      { status: 500 }
    );
  }
}
```

---

## Frontend Implementation

### React Hook for Podcast Generation

Create: `hooks/usePodcastGeneration.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

interface PodcastJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  audioUrl?: string;
  audioDuration?: number;
  transcript?: any[];
  error?: string;
}

export function usePodcastGeneration() {
  const [job, setJob] = useState<PodcastJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Start podcast generation
  const generate = useCallback(async (
    noteId: string,
    noteContent: string,
    userId: string,
    duration: 'short' | 'long' = 'short'
  ) => {
    try {
      setIsGenerating(true);

      const response = await fetch('/api/podcast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, noteContent, userId, duration }),
      });

      if (!response.ok) throw new Error('Failed to start generation');

      const data = await response.json();
      
      setJob({
        jobId: data.jobId,
        status: data.status,
        progress: 0,
      });

      return data.jobId;
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      throw error;
    }
  }, []);

  // Poll for job status
  useEffect(() => {
    if (!job?.jobId || job.status === 'completed' || job.status === 'failed') {
      setIsGenerating(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/podcast/status/${job.jobId}`);
        const data = await response.json();

        if (data.success && data.job) {
          setJob(data.job);

          if (data.job.status === 'completed' || data.job.status === 'failed') {
            clearInterval(interval);
            setIsGenerating(false);
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [job?.jobId, job?.status]);

  return {
    job,
    isGenerating,
    generate,
  };
}
```

### React Component Example

Create: `components/PodcastGenerator.tsx`

```typescript
'use client';

import { usePodcastGeneration } from '@/hooks/usePodcastGeneration';

interface Props {
  noteId: string;
  noteContent: string;
  userId: string;
}

export function PodcastGenerator({ noteId, noteContent, userId }: Props) {
  const { job, isGenerating, generate } = usePodcastGeneration();

  const handleGenerate = async (duration: 'short' | 'long') => {
    try {
      await generate(noteId, noteContent, userId, duration);
    } catch (error) {
      alert('Failed to start podcast generation');
    }
  };

  return (
    <div className="podcast-generator">
      {/* Idle state */}
      {!job && !isGenerating && (
        <div className="flex gap-4">
          <button 
            onClick={() => handleGenerate('short')}
            className="btn btn-primary"
          >
            Generate Short Podcast (3-5 min)
          </button>
          <button 
            onClick={() => handleGenerate('long')}
            className="btn btn-secondary"
          >
            Generate Long Podcast (8-10 min)
          </button>
        </div>
      )}

      {/* Generating state */}
      {isGenerating && job && (
        <div className="generating-state">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {job.progress}% - {job.currentStep || 'Processing...'}
          </p>
        </div>
      )}

      {/* Completed state */}
      {job?.status === 'completed' && job.audioUrl && (
        <div className="completed-state">
          <h3 className="text-lg font-semibold mb-4">
            🎉 Your podcast is ready!
          </h3>
          <audio 
            controls 
            src={job.audioUrl}
            className="w-full"
          />
          <p className="text-sm text-gray-600 mt-2">
            Duration: {Math.floor(job.audioDuration! / 60)}:{(job.audioDuration! % 60).toString().padStart(2, '0')}
          </p>
        </div>
      )}

      {/* Failed state */}
      {job?.status === 'failed' && (
        <div className="failed-state">
          <p className="text-red-600">
            ❌ Generation failed: {job.error || 'Unknown error'}
          </p>
          <button 
            onClick={() => handleGenerate('short')}
            className="btn btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Local Testing

### Step-by-Step Testing Guide

#### 1. Start Your Microservice

```bash
cd /path/to/podnex-proto
bun run dev
# Should run on http://localhost:3005
```

#### 2. Start Your Next.js App

```bash
cd /path/to/your-nextjs-app
npm run dev
# Should run on http://localhost:3000
```

#### 3. Expose Your Next.js App with ngrok

```bash
# Install ngrok if you don't have it
# Download from: https://ngrok.com/download

# Start ngrok
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

#### 4. Update Microservice Webhook URL

Update your microservice `.env`:

```env
WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/podcast-complete
WEBHOOK_SECRET=your-webhook-secret-key-here
```

Restart your microservice:
```bash
bun run dev
```

#### 5. Test the Complete Flow

1. **Open your Next.js app** in browser: `http://localhost:3000`
2. **Navigate to a note** with the podcast generator
3. **Click "Generate Podcast"**
4. **Watch the progress bar** update in real-time
5. **Check the logs**:
   - Microservice logs: See job processing
   - Next.js logs: See webhook received
6. **When complete**: Audio player appears!

#### 6. Verify Webhook

Check your Next.js terminal for:
```
📥 Webhook received: podcast.completed job_1766646278_abc123
✅ Podcast saved for note note-123
```

---

## Testing Without Webhooks

If you don't want to use webhooks (simpler setup), you can rely on polling:

1. **Skip** the webhook endpoint creation
2. **Remove** `WEBHOOK_URL` from microservice `.env`
3. **Use** only the status polling in your frontend

The frontend will still work perfectly with polling every 3 seconds!

---

## Production Deployment

### 1. Deploy Microservice

Deploy to a server (Railway, Render, DigitalOcean, etc.):

```env
# Production .env
PODCAST_API_URL=https://your-microservice.com/api/podcast
WEBHOOK_URL=https://your-app.vercel.app/api/webhooks/podcast-complete
```

### 2. Deploy Next.js App

Add environment variables in Vercel:

```env
PODCAST_API_URL=https://your-microservice.com/api/podcast
PODCAST_API_KEY=your-production-api-key
WEBHOOK_SECRET=your-production-webhook-secret
```

### 3. Security Checklist

- ✅ Use HTTPS for all URLs
- ✅ Use strong, random webhook secret
- ✅ Verify webhook secret on every request
- ✅ Rate limit your API endpoints
- ✅ Add authentication to your API routes
- ✅ Validate all user inputs

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Flow                             │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Generate Podcast" in Next.js app
   ↓
2. Next.js calls /api/podcast/generate
   ↓
3. Next.js API route calls microservice /generate/async
   ↓
4. Microservice returns jobId instantly (<100ms)
   ↓
5. Next.js returns jobId to frontend
   ↓
6. Frontend starts polling /api/podcast/status/:jobId every 3s
   ↓
7. Microservice processes in background (30-120s)
   │
   ├─ Generates script with OpenAI
   ├─ Generates audio with TTS
   ├─ Combines audio segments
   └─ Uploads to S3
   ↓
8. When complete, microservice calls webhook
   ↓
9. Next.js webhook saves to database
   ↓
10. Frontend polling detects completion
   ↓
11. Audio player appears with podcast!
```

---

## Troubleshooting

### Webhook Not Receiving Calls

1. **Check ngrok is running**: `ngrok http 3000`
2. **Verify webhook URL** in microservice `.env`
3. **Check webhook secret** matches in both apps
4. **Look at microservice logs** for webhook errors
5. **Test webhook manually**:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/podcast-complete \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: your-secret" \
     -d '{"event":"podcast.completed","noteId":"test"}'
   ```

### Polling Not Working

1. **Check API route** is accessible: `/api/podcast/status/:jobId`
2. **Verify jobId** is being stored in state
3. **Check browser console** for errors
4. **Verify microservice** is running and accessible

### Generation Fails

1. **Check microservice logs** for errors
2. **Verify all environment variables** are set
3. **Test microservice directly**:
   ```bash
   curl -X POST http://localhost:3005/api/podcast/generate/async \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-key" \
     -d '{"noteId":"test","noteContent":"Test content","userId":"test","duration":"short"}'
   ```

---

## Summary

### What You Created

1. ✅ **Webhook endpoint** to receive completion notifications
2. ✅ **API routes** for generation and status checking
3. ✅ **React hook** for easy frontend integration
4. ✅ **React component** with progress tracking
5. ✅ **Database schema** to store podcasts

### Benefits

- 🚀 **No timeouts** - Works perfectly with Vercel
- 📊 **Real-time progress** - Users see what's happening
- 🔔 **Instant notifications** - Via webhooks
- 💾 **Data persistence** - Stored in your database
- 🎯 **Great UX** - Loading states, progress bars, audio player

### Next Steps

1. Customize the UI to match your app's design
2. Add push notifications for mobile users
3. Implement podcast sharing features
4. Add analytics tracking
5. Consider Redis for production job queue

---

**You're all set! 🎉**
