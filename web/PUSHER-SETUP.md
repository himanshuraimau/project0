# Pusher Real-Time Progress Setup

This guide explains how to set up Pusher for real-time note generation progress updates on Vercel.

## Why Pusher?

Vercel's serverless architecture doesn't support WebSockets. Pusher provides a managed real-time messaging service that works perfectly with serverless platforms.

## Setup Steps

### 1. Create a Pusher Account

1. Go to [pusher.com](https://pusher.com) and sign up (free tier available)
2. Create a new Channels app
3. Choose your cluster (e.g., `us2`, `eu`, `ap1`)

### 2. Get Your Credentials

In your Pusher app dashboard, you'll find:
- **App ID**: e.g., `1234567`
- **Key**: e.g., `abc123def456...`
- **Secret**: e.g., `xyz789abc123...`
- **Cluster**: e.g., `us2`

### 3. Add Environment Variables

Add these to your `.env` file (local) and Vercel environment variables (production):

```env
# Pusher Server (Backend)
PUSHER_APP_ID=your_pusher_app_id_here
PUSHER_KEY=your_pusher_key_here
PUSHER_SECRET=your_pusher_secret_here
PUSHER_CLUSTER=us2

# Pusher Client (Frontend)
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key_here
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

**Note:** The `NEXT_PUBLIC_PUSHER_KEY` should be the same as `PUSHER_KEY`.

### 4. Deploy to Vercel

```bash
# Build and test locally
bun run build

# Deploy to Vercel
vercel deploy

# Or push to GitHub if connected
git add .
git commit -m "Add Pusher integration"
git push origin main
```

### 5. Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add all the Pusher environment variables
4. Redeploy your application

## How It Works

### Server Side (Note Generation)
When a note is being generated:

```typescript
// In your PDF/audio processing route
import { noteProgressManager } from "@/lib/note-progress-manager";

await noteProgressManager.publish({
  jobId: "note-123",
  progress: 50,
  stage: "processing",
  message: "Extracting content..."
});
```

This automatically publishes to Pusher via `pusher-server.ts`.

### Client Side (React Component)
The UI receives real-time updates:

```typescript
import { usePusherProgress } from "@/hooks/use-pusher-progress";

const { progress, stage, message } = usePusherProgress({
  jobId: "note-123",
  enabled: true,
});
```

## Free Tier Limits

- ✅ **100 concurrent connections** (100 users generating notes simultaneously)
- ✅ **200,000 messages per day** (~6,600 notes per day at 30 messages each)
- ✅ **Unlimited channels**

**Perfect for 1,000+ users with typical usage patterns!**

## Testing

### Local Development
```bash
bun run dev
# Upload a PDF and watch the console for Pusher logs
```

### Production (Vercel)
```bash
# Check Vercel logs
vercel logs

# Look for: "[Pusher] Subscription succeeded"
```

## Troubleshooting

### No Progress Updates
1. Check environment variables are set correctly
2. Verify `NEXT_PUBLIC_PUSHER_KEY` matches `PUSHER_KEY`
3. Check browser console for Pusher connection errors
4. Verify cluster is correct (must match in all env vars)

### "Invalid Key" Error
- Ensure `NEXT_PUBLIC_PUSHER_KEY` is set in Vercel
- Redeploy after adding environment variables

### "Subscription Failed"
- Check Pusher cluster setting
- Verify app is active in Pusher dashboard
- Check for rate limiting (free tier)

## Monitoring

Monitor your usage in the Pusher dashboard:
- **Dashboard → Overview → Usage**
- Track concurrent connections
- Track messages sent per day
- Set up alerts for quota limits

## Upgrade When Needed

If you exceed free tier limits:
- **Pro Plan ($49/mo)**: 500 connections, 1M messages/day
- **Business Plan ($199/mo)**: 2,000 connections, 5M messages/day

## Architecture

```
User Uploads PDF
     ↓
Backend Processes (Vercel Serverless)
     ↓
noteProgressManager.publish()
     ↓
Pusher Channels
     ↓
usePusherProgress() (Client)
     ↓
Real-time UI Updates
```

## Files Modified

- `/src/lib/pusher-server.ts` - Pusher server instance
- `/src/lib/note-progress-manager.ts` - Publishes to Pusher
- `/src/hooks/use-pusher-progress.ts` - Client-side Pusher hook
- `/src/components/notes/generating-note-card.tsx` - Uses Pusher for updates

## Benefits

✅ Works on Vercel (serverless)
✅ Managed service (no infrastructure)
✅ Auto-reconnection
✅ Free tier for 1,000+ users
✅ Easy to monitor
✅ Scales automatically

---

**You're all set!** 🎉 Real-time progress updates will now work on Vercel.
