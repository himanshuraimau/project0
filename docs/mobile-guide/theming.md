## Theming

Provider setup:
- `ThemeProvider` in `app/_layout.tsx` sets up theme context.
- Access with `const { theme, mode, toggleMode } = useTheme()`.

Color definitions live in:
- `lib/theme/semantic.ts` (light/dark palettes)
- `lib/theme/types.ts` (the `SemanticColors` interface)

Adding a new color token (advanced):
1) Add the key to `SemanticColors` in `lib/theme/types.ts`.
2) Define the value for both `lightColors` and `darkColors` in `lib/theme/semantic.ts`.
3) Use via `theme.colors.yourNewKey`.

Changing existing colors:
- Update values in `lib/theme/semantic.ts`. Keep keys consistent to avoid type errors throughout the app.

Toggling light/dark:
- Call `toggleMode()` from `useTheme()` when adding a UI control (e.g., a switch in settings).


