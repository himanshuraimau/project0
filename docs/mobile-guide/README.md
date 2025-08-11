## Mobile Guide (Expo + Expo Router)

This folder explains how to work safely in the mobile app so changes don’t break navigation, theming, or auth.

- See `navigation.md` for routes, Drawer, and adding screens
- See `styling.md` for styling rules using the theme system
- See `theming.md` for how our theme works and how to extend it
- See `auth.md` for Clerk usage patterns
- See `dependencies.md` for installing/upgrading packages the Expo way

Project assumptions:
- Routing: Expo Router with a Drawer shell at `app/(drawer)/`.
- Theming: `ThemeProvider` + `useTheme()` from `lib/hooks/useTheme`.
- Auth: Clerk (`@clerk/clerk-expo`).


