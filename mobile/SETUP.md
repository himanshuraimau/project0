# Flinote Mobile App Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Expo CLI: `npm install -g expo-cli eas-cli`

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `mobile/` directory:

```env
# Backend API URL
EXPO_PUBLIC_API_URL=http://192.168.1.x:3000/api  # Local development
# EXPO_PUBLIC_API_URL=https://your-domain.com/api  # Production
```

**Note:** For local development, use your computer's IP address (not `localhost`).

## Google OAuth Configuration

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

### 2. Configure Web OAuth Client
In your existing **Web Application** OAuth 2.0 Client, add the following:

#### Authorized JavaScript Origins
```
https://project0-nu.vercel.app
http://localhost:3000
```

#### Authorized Redirect URIs
```
https://project0-nu.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

**Note:** Google OAuth redirects to your backend, not directly to the mobile app. The mobile app authenticates through an in-app browser that connects to your backend, which handles the OAuth callback.

### 3. Backend Configuration
Add to `web/.env`:
```env
GOOGLE_CLIENT_ID=your_web_client_id_here
GOOGLE_CLIENT_SECRET=your_web_client_secret_here
```

**Note:** Use the **Web Application** client ID and secret in backend, not the Android/iOS ones.

## Running the App

### Development Mode
```bash
npm start                  # Start Expo dev server
```

### Scan QR Code
- Android: Use Expo Go app
- iOS: Use Camera app or Expo Go

## Building the App

### Local Development Build
```bash
npx expo prebuild --clean    # Generate native code
cd android && ./gradlew assembleDebug
```

### Production Build (with EAS)
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

Output APK location: `android/app/build/outputs/apk/`

## Troubleshooting

### OAuth Issues
- Verify scheme in [app.config.ts](app.config.ts#L7): `scheme: "flinote"`
- Check backend trusted origins in `web/src/lib/auth.ts`
- Ensure Google OAuth redirect URIs include mobile scheme

### "Network Error" on API Calls
- Use computer's IP address in `EXPO_PUBLIC_API_URL`, not `localhost`
- Ensure backend is running and accessible from mobile device
- Check firewall settings

### Android Build Failures
```bash
cd android && ./gradlew clean
cd .. && npx expo prebuild --clean --platform android
```

## Project Structure
- `app/` - Expo Router file-based routing
- `components/` - Reusable React Native components
- `lib/` - API clients, auth, utilities, stores
- `assets/` - Images, fonts, and static resources
- `locales/` - i18n translation files
