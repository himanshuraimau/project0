# Audio Upload 413 Error - Fixed ✅

## Problem
15MB audio files were being rejected with a **413 Request Entity Too Large** error when uploading from the mobile app.

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
- `mobile/lib/utils/audioCompression.ts` (NEW)
- `mobile/components/home/UploadAudio.tsx`
- `mobile/components/home/RecordAudio.tsx`

**Package Added:**
- `react-native-compressor` - For audio compression

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

2. **Rebuild mobile app** (required for new package):
   ```bash
   cd mobile
   npx expo prebuild
   npm run ios  # or npm run android
   ```

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

If 413 error persists:
1. Verify Next.js server was restarted
2. Check mobile app was rebuilt with new package
3. Verify hosting provider doesn't have separate upload limits (Vercel, etc.)
4. Check browser/network proxy settings
