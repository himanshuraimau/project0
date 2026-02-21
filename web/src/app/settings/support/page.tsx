import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SupportContent } from "@/components/settings/SupportContent";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const headersList = await headers();
  try {
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      redirect("/sign-in");
    }

    return <SupportContent />;
  } catch (error) {
    console.error("Session error:", error);
    // Allow access during development even if database is unreachable
    return <SupportContent />;
  }
}
