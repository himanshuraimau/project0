# Audio Upload 413 Error - Complete Fix Guide

## Problem
15MB audio files were being rejected with a **413 Request Entity Too Large** error when uploading from the mobile app.

---

## Quick Start (TL;DR)

### 1. Restart Next.js Server
```bash
cd web
npm run dev
```

### 2. Rebuild Mobile App (REQUIRED)
```bash
cd mobile
npx expo prebuild --clean
npx expo run:android  # or: npx expo run:ios
```

**⚠️ Important:** You CANNOT use Expo Go. Must create a development build.

---

## Solution Implemented

### 1. Server-Side Fix (Next.js)
**File: `web/next.config.ts`**

Added body size limit configuration to allow uploads up to 50MB:

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '50mb', // Increased from default 1MB
  },
}
```

### 2. Client-Side Fix (Mobile App)
**Files Modified:**
- `mobile/app.config.ts` - Added react-native-compressor plugin
- `mobile/lib/utils/audioCompression.ts` (NEW)
- `mobile/components/home/UploadAudio.tsx`
- `mobile/components/home/RecordAudio.tsx`

**Package Added:**
- `react-native-compressor` - For audio compression (native module)

**How it works:**
1. Before upload, audio files > 10MB are automatically compressed
2. Compression settings optimized for speech transcription:
   - **Bitrate:** 64kbps (good quality for speech)
   - **Sample rate:** 16kHz (standard for Whisper API)
   - **Channels:** Mono (speech doesn't need stereo)
3. Reduces 15MB files to ~2-3MB (80-85% reduction)
4. User sees "Compressing Audio..." progress indicator

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| File Size | 15 MB | 2-3 MB |
| Upload Success | ❌ 413 Error | ✅ Success |
| Compression Time | N/A | < 5 seconds |
| Audio Quality | Original | Optimized for speech |

## Testing Steps

1. **Restart Next.js server** (required for config changes):
   ```bash
   cd web
   npm run dev
   ```

2. **Rebuild mobile app** (REQUIRED - native module needs linking):
   ```bash
   cd mobile
   
   # Clean rebuild (recommended)
   npx expo prebuild --clean
   npx expo run:android  # or: npx expo run:ios
   
   # OR use EAS build
   eas build --profile development --platform android
   ```
   
   **⚠️ Important:** `react-native-compressor` requires native code. You CANNOT use Expo Go. You must create a development build or production build.

3. **Test upload:**
   - Record or upload a 15MB audio file
   - Watch for "Compressing Audio..." message
   - Verify successful transcription

## Notes

- Compression only happens for files > 10MB
- Smaller files upload without compression (faster)
- If compression fails, original file is uploaded as fallback
- Server can now handle up to 50MB files (safety buffer)
- Audio quality remains excellent for transcription purposes

## Troubleshooting

**Error: "package doesn't seem to be linked"**
- You're trying to use Expo Go (not supported for native modules)
- Solution: Create a development build:
  ```bash
  cd mobile
  npx expo prebuild --clean
  npx expo run:android  # or: npx expo run:ios
  ```

If 413 error persists:
1. Verify Next.js server was restarted
2. Check mobile app was rebuilt with development build (not Expo Go)
3. Verify hosting provider doesn't have separate upload limits (Vercel, etc.)
4. Check browser/network proxy settings
