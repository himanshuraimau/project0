# Complete Webhook Setup & Testing Guide

This guide covers everything you need to set up webhooks for podcast generation, test them locally, and deploy to production (Vercel).

---

## 📋 Table of Contents

1. [What Are Webhooks?](#what-are-webhooks)
2. [Local Testing Setup](#local-testing-setup)
3. [Production Setup (Vercel)](#production-setup-vercel)
4. [Troubleshooting](#troubleshooting)
5. [Testing Checklist](#testing-checklist)

---

## What Are Webhooks?

Webhooks allow the microservice to **notify your Next.js app** when a podcast completes, instead of your app constantly polling for updates.

**Benefits:**
- ✅ Instant notifications when podcasts complete
- ✅ No need for constant polling
- ✅ Can trigger push notifications to users
- ✅ Better user experience

**Flow:**
```
User generates podcast → Microservice processes → Webhook fires → Your app saves data → User gets notified
```

---

## Local Testing Setup

### Step 1: Generate a Webhook Secret

```bash
openssl rand -base64 32
```

**Example output:** `giQqgEcKKffbpy2/8AwVGNyO05FXMaP+xP8F9fD1S/o=`

Save this - you'll use it in both apps!

### Step 2: Configure Microservice

Update your microservice `.env`:

```env
# For local testing
WEBHOOK_URL=http://localhost:3099/webhook
WEBHOOK_SECRET=giQqgEcKKffbpy2/8AwVGNyO05FXMaP+xP8F9fD1S/o=
```

### Step 3: Restart Microservice

```bash
# Stop current server (Ctrl+C)
bun run dev
```

You should see:
```
✓ Server running on port 3005
🚀 Job processor started
```

### Step 4: Run the Test

```bash
./test-webhook.sh
```

**What the test does:**
1. Starts a local webhook server on port 3099
2. Triggers async podcast generation
3. Polls for job status with real-time progress
4. Receives webhook notification when complete
5. Verifies webhook payload is correct

**Expected output:**

```
🧪 WEBHOOK-BASED ASYNC PODCAST GENERATION TEST
============================================================

[Step 1] Starting local webhook server
✅ Webhook server listening on http://localhost:3099/webhook

[Step 2] Starting podcast generation (async)
✅ Job created: job_1766774372675_q2ro62lbr
ℹ️  Status: queued

[Step 3] Polling for job status
⏳ 5% - Creating database record... (2s elapsed)
⏳ 15% - Generating podcast script... (5s elapsed)
⏳ 30% - Generating audio for segment 1/17... (15s elapsed)
⏳ 50% - Generating audio for segment 10/17... (35s elapsed)
⏳ 75% - Combining audio segments... (50s elapsed)
⏳ 90% - Uploading to S3... (55s elapsed)

============================================================
✅ PODCAST COMPLETED in 60s!
============================================================
Audio URL: https://podnext-audio-storage.s3.us-east-1.amazonaws.com/...
Duration: 285s
Podcast ID: 694ed6641c8a3403e4486390
============================================================

============================================================
🔔 WEBHOOK RECEIVED!
============================================================
✅ Webhook secret verified
Event: podcast.completed
Job ID: job_1766774372675_q2ro62lbr
Note ID: test-note-1766774372675
Audio URL: https://podnext-audio-storage.s3.us-east-1.amazonaws.com/...
Duration: 285s
✅ Podcast generation completed!
============================================================

[Step 4] Verifying webhook delivery
✅ Webhook received successfully!
✅ Job ID matches
✅ Event type is correct

============================================================
📊 TEST SUMMARY
============================================================
✅ Podcast generated successfully
✅ Job polling worked correctly
✅ Webhook received and verified

⏱️  Total test time: 62s
🎉 TEST COMPLETED SUCCESSFULLY!
============================================================
```

### Step 5: Verify in Microservice Logs

You should see in your `bun dev` terminal:

```
📋 Created job: job_xxx
▶️  Started job: job_xxx
📊 Job job_xxx: 5% - Creating database record...
📊 Job job_xxx: 15% - Generating podcast script...
...
✅ Completed job: job_xxx
📤 Sending webhook to http://localhost:3099/webhook
✅ Webhook delivered successfully (200)
```

---

## Production Setup (Vercel)

### Step 1: Create Webhook Endpoint in Next.js

Create: `app/api/webhooks/podcast-complete/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Your database client

export async function POST(request: Request) {
  try {
    // 1. Verify webhook secret for security
    const secret = request.headers.get('x-webhook-secret') || 
                   request.headers.get('X-Webhook-Secret');
    
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

### Step 2: Handle Middleware (Important!)

If you have authentication middleware, you need to **bypass it for webhooks**.

**Option A: Update existing middleware.ts**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for webhook endpoints
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }
  
  // Your existing middleware logic here
  // ...
}

export const config = {
  matcher: [
    // Exclude webhooks from middleware
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Option B: Create middleware.ts if you don't have one**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow webhooks to pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Step 3: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com → Your Project → Settings → Environment Variables

2. **Add the webhook secret:**
   ```
   Key: WEBHOOK_SECRET
   Value: giQqgEcKKffbpy2/8AwVGNyO05FXMaP+xP8F9fD1S/o=
   ```

3. **Set for all environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **Click "Save"**

### Step 4: Redeploy Your App

**Important:** Vercel doesn't auto-redeploy when you add environment variables!

**Option A: Trigger redeploy from dashboard**
- Go to Deployments → Click "..." → Redeploy

**Option B: Push a commit**
```bash
git commit --allow-empty -m "Trigger redeploy for webhook env vars"
git push
```

### Step 5: Update Microservice Configuration

Update your microservice `.env` for production:

```env
# Production webhook
WEBHOOK_URL=https://your-app.vercel.app/api/webhooks/podcast-complete
WEBHOOK_SECRET=giQqgEcKKffbpy2/8AwVGNyO05FXMaP+xP8F9fD1S/o=
```

**Important:** Use the **same secret** in both places!

### Step 6: Restart Microservice

```bash
# If running locally
bun run dev

# If deployed (Railway, Render, etc.)
# Restart via your hosting platform
```

### Step 7: Test Production Webhook

Generate a podcast from your production app and check:

**In Vercel Function Logs:**
```
📥 Webhook received: podcast.completed job_xxx
✅ Podcast saved for note note-xxx
```

**In Microservice Logs:**
```
✅ Completed job: job_xxx
📤 Sending webhook to https://your-app.vercel.app/api/webhooks/podcast-complete
✅ Webhook delivered successfully (200)
```

---

## Troubleshooting

### Issue 1: "401 Unauthorized" in Vercel

**Symptoms:**
```
❌ Webhook delivery failed: Request failed with status code 401
```

**Causes:**
1. `WEBHOOK_SECRET` not set in Vercel
2. Secret doesn't match between microservice and Vercel
3. Middleware is blocking the request

**Solutions:**

**A. Check Vercel Environment Variables**
```bash
# Verify the secret is set
vercel env ls

# Or check in Vercel dashboard
# Settings → Environment Variables → WEBHOOK_SECRET
```

**B. Verify Secrets Match**
```bash
# Microservice .env
WEBHOOK_SECRET=giQqgEcKKffbpy2/8AwVGNyO05FXMaP+xP8F9fD1S/o=

# Vercel env var (must be identical)
WEBHOOK_SECRET=giQqgEcKKffbpy2/8AwVGNyO05FXMaP+xP8F9fD1S/o=
```

**C. Check Middleware**
Make sure webhook routes are excluded from auth middleware (see Step 2 above).

**D. Test the endpoint directly**
```bash
curl -X POST https://your-app.vercel.app/api/webhooks/podcast-complete \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"event":"podcast.completed","noteId":"test","userId":"test","duration":"short","timestamp":"2024-01-01T00:00:00Z"}'
```

Expected: `{"success":true}`
If you get 401: Secret is wrong or middleware is blocking

### Issue 2: "ECONNREFUSED" (Local Testing)

**Symptoms:**
```
❌ Webhook delivery failed: ECONNREFUSED
```

**Cause:** Webhook server isn't running or wrong port

**Solution:**
```bash
# Make sure test server is running
./test-webhook.sh

# Or check webhook URL in .env
WEBHOOK_URL=http://localhost:3099/webhook  # Correct port
```

### Issue 3: "404 Not Found"

**Symptoms:**
```
❌ Webhook delivery failed: Request failed with status code 404
```

**Cause:** Webhook endpoint doesn't exist

**Solution:**
1. Verify file exists: `app/api/webhooks/podcast-complete/route.ts`
2. Check file exports `POST` function
3. Redeploy your Next.js app

### Issue 4: Webhook Received but Data Not Saved

**Symptoms:**
- Webhook logs show "received"
- But database has no data

**Cause:** Database error or logic issue

**Solution:**
1. Check Vercel function logs for errors
2. Verify database connection works
3. Test database operations manually
4. Add more logging to webhook handler

### Issue 5: Header Case Sensitivity

**Symptoms:**
- Works locally but fails in production
- 401 errors

**Cause:** Different header casing

**Solution:**
```typescript
// Handle both cases
const secret = request.headers.get('x-webhook-secret') || 
               request.headers.get('X-Webhook-Secret');
```

---

## Testing Checklist

### ✅ Local Testing

- [ ] Generated webhook secret with `openssl rand -base64 32`
- [ ] Updated microservice `.env` with local webhook URL
- [ ] Updated microservice `.env` with webhook secret
- [ ] Restarted microservice
- [ ] Ran `./test-webhook.sh`
- [ ] Test completed successfully
- [ ] Webhook received and verified
- [ ] Checked microservice logs show webhook success

### ✅ Production Testing (Vercel)

- [ ] Created webhook endpoint: `app/api/webhooks/podcast-complete/route.ts`
- [ ] Updated/created `middleware.ts` to bypass webhooks
- [ ] Added `WEBHOOK_SECRET` to Vercel environment variables
- [ ] Set secret for Production, Preview, and Development
- [ ] Redeployed Next.js app
- [ ] Updated microservice `.env` with production webhook URL
- [ ] Updated microservice `.env` with same webhook secret
- [ ] Restarted microservice
- [ ] Generated test podcast from production app
- [ ] Checked Vercel function logs for webhook received
- [ ] Checked microservice logs for webhook success (200)
- [ ] Verified data saved to database
- [ ] Tested failure scenario (optional)

### ✅ Security Checklist

- [ ] Using strong random webhook secret (32+ characters)
- [ ] Secret is different for local vs production
- [ ] Secret is stored in environment variables (not hardcoded)
- [ ] Webhook endpoint verifies secret on every request
- [ ] Using HTTPS for production webhook URL
- [ ] Webhook route excluded from public access middleware
- [ ] Database operations use proper validation
- [ ] Error messages don't leak sensitive information

---

## Webhook Payload Reference

### Success Event

```json
{
  "event": "podcast.completed",
  "jobId": "job_1766774372675_q2ro62lbr",
  "noteId": "note-456",
  "userId": "user-789",
  "duration": "short",
  "podcastId": "694ed6641c8a3403e4486390",
  "audioUrl": "https://podnext-audio-storage.s3.us-east-1.amazonaws.com/podcasts/podcast-xxx.mp3",
  "audioDuration": 285,
  "transcript": [
    {
      "speaker": "host",
      "text": "Welcome to today's discussion...",
      "startTime": 0,
      "endTime": 12.5
    },
    {
      "speaker": "guest",
      "text": "Thanks for having me...",
      "startTime": 12.5,
      "endTime": 25.3
    }
  ],
  "timestamp": "2025-12-27T00:00:00.000Z"
}
```

### Failure Event

```json
{
  "event": "podcast.failed",
  "jobId": "job_1766774372675_q2ro62lbr",
  "noteId": "note-456",
  "userId": "user-789",
  "duration": "short",
  "error": "Failed to generate audio: API timeout",
  "timestamp": "2025-12-27T00:00:00.000Z"
}
```

### Headers

```
Content-Type: application/json
X-Webhook-Secret: giQqgEcKKffbpy2/8AwVGNyO05FXMaP+xP8F9fD1S/o=
User-Agent: PodcastMicroservice/1.0
```

---

## Quick Reference

### Local Testing Commands

```bash
# Generate secret
openssl rand -base64 32

# Run test
./test-webhook.sh

# Check microservice logs
# (in terminal running bun dev)
```

### Vercel Commands

```bash
# Check environment variables
vercel env ls

# Add environment variable
vercel env add WEBHOOK_SECRET

# Trigger redeploy
git commit --allow-empty -m "Redeploy"
git push
```

### Debug Commands

```bash
# Test webhook endpoint directly
curl -X POST https://your-app.vercel.app/api/webhooks/podcast-complete \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"event":"podcast.completed","noteId":"test","userId":"test","duration":"short","timestamp":"2024-01-01T00:00:00Z"}'

# Check if endpoint exists
curl https://your-app.vercel.app/api/webhooks/podcast-complete

# View Vercel logs
vercel logs
```

---

## Summary

**Local Testing:**
1. Generate secret → Update `.env` → Run `./test-webhook.sh` → ✅

**Production (Vercel):**
1. Create webhook endpoint → Update middleware → Add env var → Redeploy → ✅

**Common Issues:**
- 401 = Secret mismatch or middleware blocking
- 404 = Endpoint doesn't exist
- ECONNREFUSED = Server not running

**Need Help?**
- Check Vercel function logs
- Check microservice logs
- Test endpoint with curl
- Verify secrets match exactly

---

**You're all set!** 🎉

Your webhook system is now ready for both local development and production use.
