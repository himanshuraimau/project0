# Audio Upload 413 Error - VERCEL LIMIT!

## Problem
15MB audio files fail with **413 error** when uploading from mobile app to Vercel.

---

## Root Cause: Vercel Body Size Limit

You're using Vercel (`https://project0-nu.vercel.app`), which has strict limits:

**Vercel Limits:**
- **Hobby Plan:** 4.5MB body size (CANNOT be changed)
- **Pro Plan:** 4.5MB default (can request increase to 100MB)
- **Enterprise:** Custom limits

Your 15MB audio file exceeds Vercel's limit, so it returns 413.

**Why web app might work:**
- If testing on `localhost` → No Vercel limit
- If testing on Vercel → Should also fail with 15MB

---

## Solutions

### Option 1: Client-Side Compression ⭐ (Recommended)

Compress audio before upload (15MB → 2-3MB):

**Pros:**
- Works with Vercel Hobby plan (free)
- Faster uploads
- Better user experience

**Cons:**
- Requires mobile app rebuild
- Can't use Expo Go (need development build)

**Implementation:** I can add this back - it will compress files automatically before upload.

---

### Option 2: Upgrade Vercel to Pro

**Cost:** $20/month per member
**Benefit:** Can request body size increase to 100MB
**Process:** 
1. Upgrade to Pro
2. Contact Vercel support to increase limit
3. Wait for approval

---

### Option 3: Use Vercel Blob Storage

Upload large files to Vercel Blob, then process:

1. Mobile app uploads to Vercel Blob (no size limit)
2. Get blob URL
3. Send URL to your API
4. API downloads from blob and processes

**Pros:** Works with Hobby plan
**Cons:** Requires code refactoring + Blob storage costs

---

### Option 4: Use Different Hosting

Deploy to platforms with higher limits:
- **Railway:** 100MB default
- **Render:** 100MB default  
- **Self-hosted:** Unlimited

---

## Recommended Solution

**For your situation (no emulator, using Vercel Hobby):**

I recommend **Option 1: Client-Side Compression**

**Why:**
- ✅ Free (no Vercel upgrade needed)
- ✅ Works with your current setup
- ✅ Reduces 15MB → 2-3MB (well under 4.5MB limit)
- ✅ Faster uploads for users
- ✅ Can build with EAS (no emulator needed)

**Build with EAS (Cloud Build):**
```bash
cd mobile

# Build in the cloud (no emulator needed!)
eas build --profile development --platform android

# After build completes:
# 1. Download APK from EAS dashboard
# 2. Install on your physical device
# 3. Test upload - will compress automatically
```

---

## Quick Test

Want to verify it's Vercel's limit?

1. **Test with a 4MB file** - should work
2. **Test with a 5MB file** - should fail with 413

This confirms it's Vercel's 4.5MB limit.

---

## Next Steps

**Option A: Add compression (I can do this now)**
- I'll add back the compression code
- You build with EAS cloud build
- Install on your phone
- Test - should work!

**Option B: Upgrade Vercel**
- Upgrade to Pro ($20/month)
- Request limit increase
- Wait for approval

Which option do you prefer?
