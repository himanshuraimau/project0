# Expo Build Guide

## Local Development
```bash
npx expo start --dev-client
npx expo run:android
npx expo run:ios
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
```

Check `eas.json` for build profiles. Builds run on EAS cloud servers.
