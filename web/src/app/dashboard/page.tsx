import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { NewNoteSection, MyNotesSection } from "@/components/dashboard";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      <NewNoteSection />
      <MyNotesSection />
    </div>
  );
}
