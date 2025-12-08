import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { FoldersWithNotesSection } from "@/components/folders/folders-with-notes-section";

export default async function FoldersPage() {
  const session = await auth.api.getSession({ headers: await headers() }); const userId = session?.user?.id;

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="w-full space-y-12">
      <FoldersWithNotesSection />
    </div>
  );
}
