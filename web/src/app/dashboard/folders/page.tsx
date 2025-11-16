import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FoldersWithNotesSection } from "@/components/folders/folders-with-notes-section";

export default async function FoldersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="w-full space-y-12">
      <FoldersWithNotesSection />
    </div>
  );
}
