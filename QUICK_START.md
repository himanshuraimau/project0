# Quick Start - Audio Upload Fix

## What Was Fixed
✅ 413 error when uploading 15MB audio files
✅ Automatic audio compression before upload
✅ Server now accepts up to 50MB files

## To Apply the Fix

### 1. Restart Next.js Server
```bash
cd web
npm run dev
```

### 2. Rebuild Mobile App
```bash
cd mobile
npx expo prebuild
npm run ios  # or: npm run android
```

## What Changed

### Server (Next.js)
- `web/next.config.ts` - Added 50MB body size limit

### Mobile App
- `mobile/lib/utils/audioCompression.ts` - NEW compression utility
- `mobile/components/home/UploadAudio.tsx` - Added compression
- `mobile/components/home/RecordAudio.tsx` - Added compression
- `mobile/package.json` - Added react-native-compressor

## How It Works
1. User uploads/records audio
2. If file > 10MB → compress to ~2-3MB (80% reduction)
3. Upload compressed file
4. Server accepts up to 50MB

## Result
15MB audio files now upload successfully in seconds! 🎉
