## Auth (Clerk)

Provider:
- Configured in `app/_layout.tsx` using `ClerkProvider` with `tokenCache`.

Usage patterns:
- Use `SignedIn`, `SignedOut`, `useUser`, and `useAuth` from `@clerk/clerk-expo`.

Example:
```tsx
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'

export default function Home() {
  const { user } = useUser()
  return (
    <>
      <SignedIn>Welcome {user?.emailAddresses[0].emailAddress}</SignedIn>
      <SignedOut>{/* Show sign-in/up links */}</SignedOut>
    </>
  )
}
```

Route protection options:
- Gate content inside a screen using `SignedIn`/`SignedOut`.
- For auth-only route groups, mirror the pattern in `app/(auth)/_layout.tsx` to redirect signed-in users away from auth screens.

Sign-in and sign-up:
- Present at `app/(auth)/sign-in.tsx` and `app/(auth)/sign-up.tsx`.


