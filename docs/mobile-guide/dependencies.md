## Dependencies (Expo-safe installs)

Always install libraries with Expo so versions match the SDK:

```bash
cd mobile
npx expo install <package-name>
```

Examples:
- React Navigation Drawer:
```bash
npx expo install @react-navigation/drawer
```

Notes:
- Many React Native libs require native modules. `expo install` picks compatible versions.
- After installs, restart the dev server. For iOS simulators, if you prebuild/eject, run CocoaPods.
- Gesture/reanimated are already included in this project (`react-native-gesture-handler`, `react-native-reanimated`). No extra config needed with the managed workflow.

Running the app:
```bash
npm run android
npm run ios
```


