"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRedirectIfAuthenticated(redirectTo = "/dashboard") {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace(redirectTo);
    }
  }, [isPending, session, redirectTo, router]);

  return { session, isPending };
}
