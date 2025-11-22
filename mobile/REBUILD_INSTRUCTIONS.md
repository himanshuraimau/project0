# Rebuild Instructions

After adding the `expo-media-library` plugin to `app.json`, you need to rebuild the native code.

## For Development

### Android
```bash
npx expo prebuild --clean
npx expo run:android
```

### iOS
```bash
npx expo prebuild --clean
npx expo run:ios
```

## Alternative: Using Expo Go (Development Only)

If you're using Expo Go for development, the media library permissions should work automatically after restarting the app.

## For Production Build

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

## What Changed

Added `expo-media-library` plugin configuration to `app.json` with the following permissions:
- `photosPermission`: Access to photos
- `savePhotosPermission`: Permission to save photos
- `isAccessMediaLocationEnabled`: Access to media location metadata

This configuration ensures only the necessary permissions are requested (not AUDIO permissions).
