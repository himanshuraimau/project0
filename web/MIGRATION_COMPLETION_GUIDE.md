# Clerk to Better Auth Migration - Completion Guide

## ✅ COMPLETED (Steps 1-12)

### Phase 1: Infrastructure Setup ✅
- ✅ Installed Better Auth package
- ✅ Updated environment variables in `.env.example`
- ✅ Created Better Auth server instance at `/web/src/lib/auth.ts`
- ✅ Updated Prisma schema with Better Auth tables
- ✅ Created API route handler at `/web/src/app/api/auth/[...all]/route.ts`
- ✅ Created Better Auth client at `/web/src/lib/auth-client.ts`

### Phase 2: Core Implementation ✅
- ✅ Updated middleware to use Better Auth session checking
- ✅ Rewrote auth helper utilities
- ✅ Created custom sign-in page with email/password + Google OAuth
- ✅ Created custom sign-up page with email/password + Google OAuth
- ✅ Removed ClerkProvider from root layout

## 🚧 REMAINING TASKS (Steps 13-20)

### Step 13: Update User Control Component
**File:** `/web/src/components/user-control.tsx`

Replace Clerk's `UserButton` with custom dropdown using Better Auth session:

```tsx
"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserControl() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <User className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Step 14: Update Landing Page Components

#### File: `/web/src/components/landing/header.tsx`
Replace Clerk components:
```tsx
// Replace
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs"

// With
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import { UserControl } from "@/components/user-control"

// Then update JSX:
const { data: session } = useSession();

{session ? (
  <UserControl />
) : (
  <>
    <Link href="/sign-in">
      <Button variant="ghost">Sign In</Button>
    </Link>
    <Link href="/sign-up">
      <Button>Sign Up</Button>
    </Link>
  </>
)}
```

#### File: `/web/src/components/landing/hero.tsx`
Same replacements as header.tsx

### Step 15: Update Auth Components

#### File: `/web/src/components/auth/auth-loading.tsx`
```tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function AuthLoading({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
```

#### File: `/web/src/components/auth/auto-redirect.tsx`
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function AutoRedirect() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return null;
}
```

### Step 16: Update API Routes

Need to update these files to use `auth.api.getSession()` instead of Clerk's `auth()`:

1. `/web/src/app/api/uploadthing/core.ts`
2. `/web/src/app/api/documents/route.ts`
3. Any other API routes using `import { auth } from '@clerk/nextjs/server'`

**Pattern to follow:**
```typescript
// OLD (Clerk)
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();

// NEW (Better Auth)
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
const session = await auth.api.getSession({ headers: await headers() });
const userId = session?.user?.id;
```

### Step 17: Remove Clerk Webhook Handler
- Delete `/web/src/app/api/webhooks/clerk/route.ts`
- Better Auth handles user creation automatically

### Step 18: Update Debug Component
- Remove or update `/web/src/components/debug/user-sync-status.tsx`
- Can be deleted if not needed, or updated to show Better Auth session info

### Step 19: Testing Checklist

Before going live, test:
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign up with Google OAuth
- [ ] Sign in with Google OAuth
- [ ] Session persistence (refresh page)
- [ ] Protected routes redirect to sign-in
- [ ] Sign out functionality
- [ ] User profile display
- [ ] Mobile app authentication (if applicable)

### Step 20: Final Cleanup

Run these commands:
```bash
cd /home/himanshu/code/project0/web
bun remove @clerk/nextjs @clerk/themes svix
```

Then search and remove any remaining Clerk references:
```bash
grep -r "@clerk" web/src/
grep -r "clerk" web/src/
```

## 📝 Environment Setup Required

Before testing, add these to your `.env`:
```bash
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="nZ7G9GqEdrovAUZcRYkJ189a0BAKRzmW1T86VUqoPlw="
BETTER_AUTH_URL="http://localhost:3000"

# Optional: For Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

## 🗄️ Database Migration

Run this command when your DATABASE_URL is configured:
```bash
cd /home/himanshu/code/project0/web
bun prisma migrate dev --name add_better_auth_tables
```

## 🚀 Starting the App

1. Set up environment variables
2. Run database migration
3. Start the dev server:
```bash
cd /home/himanshu/code/project0/web
bun dev
```

## 📚 Google OAuth Setup

To enable Google sign-in:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

## ⚠️ Important Notes

1. **User Data**: Existing Clerk users won't automatically migrate. Users need to sign up again.
2. **Sessions**: All existing sessions will be invalidated
3. **Mobile App**: Update mobile app to use Better Auth endpoints
4. **Subscription System**: Should work unchanged as it's tied to userId
5. **Email Verification**: Currently disabled (`requireEmailVerification: false`). Enable in production with an email service.

## 🎯 Next Steps After Migration

1. Set up email verification (optional)
2. Configure password reset functionality
3. Add two-factor authentication (via Better Auth plugins)
4. Set up email service for transactional emails
5. Update mobile app authentication flow

---

## Files Modified Summary

### Created:
- `/web/src/lib/auth.ts` - Better Auth server config
- `/web/src/lib/auth-client.ts` - Better Auth client
- `/web/src/app/api/auth/[...all]/route.ts` - Auth API handler
- `/web/src/app/(home)/sign-in/page.tsx` - Custom sign-in page
- `/web/src/app/(home)/sign-up/page.tsx` - Custom sign-up page

### Modified:
- `/web/.env.example` - Updated auth environment variables
- `/web/prisma/schema.prisma` - Added Better Auth tables
- `/web/src/middleware.ts` - Better Auth session checking
- `/web/src/lib/auth-helper.ts` - Better Auth utilities
- `/web/src/app/layout.tsx` - Removed ClerkProvider

### To Be Modified:
- `/web/src/components/user-control.tsx`
- `/web/src/components/landing/header.tsx`
- `/web/src/components/landing/hero.tsx`
- `/web/src/components/auth/auth-loading.tsx`
- `/web/src/components/auth/auto-redirect.tsx`
- All API routes using Clerk auth

### To Be Deleted:
- `/web/src/app/api/webhooks/clerk/route.ts`
- Optional: `/web/src/components/debug/user-sync-status.tsx`
