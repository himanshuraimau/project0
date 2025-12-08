import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NewNoteSection, MyNotesSection } from "@/components/dashboard";
import { FreeTierWarning } from "@/components/subscription";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="w-full space-y-12">
      <FreeTierWarning />
      <NewNoteSection />
      <MyNotesSection />
    </div>
  );
}
