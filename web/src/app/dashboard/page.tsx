import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { NewNoteSection, MyNotesSection } from "@/components/dashboard";
import { FreeTierWarning } from "@/components/subscription";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
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
