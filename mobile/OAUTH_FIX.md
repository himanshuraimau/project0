# OAuth Redirect Fix After Scheme Change

## Issue
After changing the app scheme from the previous value to `flinote`, Google OAuth redirects are failing because:
1. The Android manifest needs to be regenerated with the new scheme
2. The Google OAuth redirect URI in Google Cloud Console needs to be updated

## Fixed Files
✅ `app.config.ts` - scheme is set to `"flinote"` (lowercase)
✅ `lib/auth/auth-client.ts` - scheme matches: `"flinote"`
✅ `lib/utils/oauthDiagnostics.ts` - updated to use `"flinote"` instead of `"Flinote"`

## Steps to Fix

### 1. Rebuild Android Native Project
The Android manifest needs to be regenerated with the new scheme:
```bash
cd /home/himanshu/code/project0/mobile
npx expo prebuild --platform android --clean
```

### 2. Update Google Cloud Console OAuth Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID (the one used for mobile app)
4. Under "Authorized redirect URIs", add/update:
   - `flinote://` (for the new scheme)
   - Keep the old scheme if you have existing users: `Flinote://` or whatever it was before

### 3. Verify Redirect URI Format
The redirect URI should be in the format:
- `flinote://` (for deep linking)
- Or `flinote://oauth/callback` (if using a specific callback path)

Better Auth with Expo plugin should handle this automatically, but verify the exact format by checking the logs when you try to sign in.

### 4. Test the Sign-In Flow
1. Rebuild and install the app on your Android device/emulator
2. Try signing in with Google
3. Check the console logs for the redirect URI being used
4. Verify that Google redirects back to your app

## Debugging

If it still doesn't work, check:
1. **Console logs** - Look for the redirect URI being generated
2. **Google Cloud Console** - Verify the redirect URI matches exactly (case-sensitive)
3. **Android manifest** - Check `android/app/src/main/AndroidManifest.xml` after prebuild to ensure the intent filter includes `flinote://`

## Quick Test Command
```bash
# Rebuild Android project
npx expo prebuild --platform android --clean

# Then build and run
npx expo run:android
```
