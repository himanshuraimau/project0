import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SupportPageContent } from "@/components/support/support-page-content";

export default async function SupportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="w-full space-y-10">
      <SupportPageContent />
    </div>
  );
}
