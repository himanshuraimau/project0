# Expo Build Guide

## Local Development
```bash
npx expo start --dev-client
npx expo run:android
npx expo run:ios
```

## Clean Local Android Build

### Step 1: Clean Everything
```bash
# Remove node_modules and lock files
rm -rf node_modules package-lock.json

# Remove Android build directory
rm -rf android

# Remove iOS build directory (if exists)
rm -rf ios

# Clean Gradle cache (if android directory exists)
cd android && ./gradlew clean && cd ..
```

### Step 2: Reinstall Dependencies
```bash
npm install
```

### Step 3: Rebuild Native Project
```bash
# Generate fresh Android/iOS native code
npx expo prebuild --clean --platform android
```

### Step 4: Build Release APK Locally
```bash
# Navigate to Android directory
cd android

# Clean Gradle build
./gradlew clean

# Build release APK
./gradlew assembleRelease

# The APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### Quick Clean Build (All Steps Combined)
```bash
# Clean everything
rm -rf node_modules package-lock.json android ios

# Reinstall dependencies
npm install

# Rebuild native project
npx expo prebuild --clean --platform android

# Build APK
cd android && ./gradlew clean assembleRelease && cd ..

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

## Rebuild After Config Changes
```bash
npx expo prebuild --clean
```

## EAS Production Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Build both
eas build --platform all --profile production

# Preview build
npx eas build --platform android --profile preview --no-wait
```

Check `eas.json` for build profiles. Builds run on EAS cloud servers.
