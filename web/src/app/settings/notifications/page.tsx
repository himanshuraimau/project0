import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NotificationsContent } from "@/components/settings/NotificationsContent";

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      redirect("/sign-in");
    }

    return <NotificationsContent />;
  } catch (error) {
    console.error("Session error:", error);
    // Allow access during development even if database is unreachable
    return <NotificationsContent />;
  }
}
