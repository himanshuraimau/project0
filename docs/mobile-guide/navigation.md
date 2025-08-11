## Navigation (Expo Router + Drawer)

Top-level structure:
- `app/_layout.tsx` wraps providers and gesture handler.
- Drawer shell at `app/(drawer)/_layout.tsx`.
- Default route redirects to the drawer home in `app/index.tsx`.
- Home lives at `app/(drawer)/(home)/index.tsx`.

Add a new Drawer item:
1) Create a new route group or screen in `app/(drawer)/`.
   - Example: `app/(drawer)/(notes)/index.tsx`
2) Register it in `app/(drawer)/_layout.tsx` via `<Drawer.Screen />`:

```tsx
// app/(drawer)/_layout.tsx
<Drawer.Screen name="(notes)" options={{ title: 'Notes' }} />
```

Add a nested stack inside a drawer item:
1) Inside your group, add a `_layout.tsx` that returns a `Stack`:

```tsx
// app/(drawer)/(notes)/_layout.tsx
import { Stack } from 'expo-router/stack'
export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

2) Add screens under that folder (e.g., `index.tsx`, `[id].tsx`).

Linking between screens:
- Use `Link` from `expo-router`:

```tsx
import { Link } from 'expo-router'
<Link href="/(drawer)/(notes)">Open Notes</Link>
```

Route names to use in `<Drawer.Screen name="..." />` come from the folder or file segment name (e.g., `"(notes)"` for the group at `app/(drawer)/(notes)`).

Do not rename or remove `app/(drawer)/_layout.tsx` or `app/index.tsx` without updating redirects and screen registrations.


