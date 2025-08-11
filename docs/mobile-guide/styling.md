## Styling Guidelines

We use a lightweight theme system exposed by `useTheme()`.

Key theme fields (see `lib/theme/types.ts` and `lib/theme/semantic.ts`):
- `theme.colors`: `background`, `surface`, `text`, `mutedText`, `accent`, etc.
- `theme.spacing`: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
- `theme.fontSize`: `xs` through `3xl`
- `theme.radius`, `theme.borderWidth`, `theme.shadow()`

Example usage:
```tsx
import { useTheme } from '@/lib/hooks/useTheme'

export default function Card() {
  const { theme } = useTheme()
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        ...theme.shadow(),
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.md }}>
        Hello
      </Text>
    </View>
  )
}
```

Prefer theme values over raw hex or numbers to keep a consistent look and easy dark mode.

UI components:
- Shared UI lives in `components/ui/` (e.g., `button.tsx`). Prefer these over one-off custom styles.

Do:
- Use `theme.colors.*`, `theme.spacing.*`, `theme.fontSize.*` consistently.
- Keep styles local and component-scoped. Extract common patterns into `components/ui`.

Avoid:
- Hard-coding colors or measurements that duplicate theme values.
- Global style mutations.


