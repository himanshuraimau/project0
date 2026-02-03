#!/bin/bash

# Script to reinstall all dependencies properly for Expo project
# This ensures version compatibility by using expo install for Expo packages

set -e

echo "🚀 Starting dependency reinstallation..."

# Remove node_modules and lock files
echo "📦 Cleaning up existing dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install expo first (required before using expo install command)
echo "📱 Installing Expo SDK packages..."
npm install expo

# Now install core React Native packages (using expo install for compatibility)
npx expo install react
npx expo install react-dom
npx expo install react-native

# Install Expo packages (using expo install)
echo "📦 Installing Expo packages..."
npx expo install expo-router
npx expo install expo-auth-session
npx expo install expo-av
npx expo install expo-blur
npx expo install expo-clipboard
npx expo install expo-constants
npx expo install expo-crypto
npx expo install expo-document-picker
npx expo install expo-file-system
npx expo install expo-font
npx expo install expo-haptics
npx expo install expo-image
npx expo install expo-linear-gradient
npx expo install expo-linking
npx expo install expo-localization
npx expo install expo-media-library
npx expo install expo-navigation-bar
npx expo install expo-network
npx expo install expo-secure-store
npx expo install expo-sharing
npx expo install expo-splash-screen
npx expo install expo-status-bar
npx expo install expo-symbols
npx expo install expo-system-ui
npx expo install expo-web-browser

# Install React Native community packages
echo "⚛️ Installing React Native packages..."
npm install @react-native-async-storage/async-storage
npm install @react-native-masked-view/masked-view
npm install @react-native-picker/picker
npm install react-native-gesture-handler
npm install react-native-reanimated
npm install react-native-safe-area-context
npm install react-native-screens
npm install react-native-svg
npm install react-native-webview
npm install react-native-web
npm install react-native-inappbrowser-reborn
npm install react-native-katex
npm install react-native-keyboard-aware-scroll-view
npm install react-native-markdown-display
npm install react-native-picker-select
npm install react-native-render-html
npm install react-native-toast-message
npm install react-native-vector-icons
npm install react-native-view-shot
npm install react-native-worklets

# Install React Navigation packages
echo "🧭 Installing React Navigation packages..."
npm install @react-navigation/native
npm install @react-navigation/bottom-tabs
npm install @react-navigation/drawer
npm install @react-navigation/elements

# Install other dependencies
echo "📚 Installing other dependencies..."
npm install @10play/tentap-editor
npm install @better-auth/expo
npm install @expo/vector-icons
npm install @tiptap/core
npm install @tiptap/pm
npm install axios
npm install better-auth
npm install i18next
npm install lucide-react-native
npm install marked
npm install react-i18next

# Install dev dependencies
echo "🛠️ Installing dev dependencies..."
npm install --save-dev @babel/core
npm install --save-dev @types/react
npm install --save-dev eas-cli
npm install --save-dev eslint
npm install --save-dev eslint-config-expo
npm install --save-dev typescript

echo "✅ All dependencies installed successfully!"
echo "📝 Run 'npm start' to start the development server"
