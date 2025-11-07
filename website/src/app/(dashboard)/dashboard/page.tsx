import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { NewNoteSection, MyNotesSection } from "@/components/features/dashboard";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="w-full space-y-12">
      {/* Top - New Note Section */}
      <NewNoteSection />
      
      {/* Bottom - My Notes Section */}
      <MyNotesSection />
    </div>
  );
}