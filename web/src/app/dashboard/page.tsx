import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { NewNoteSection, MyNotesSection } from "@/components/dashboard";
import { DashboardRefreshProvider } from "@/contexts/dashboard-refresh-context";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <DashboardRefreshProvider>
      <div className="w-full space-y-12">
        <NewNoteSection />
        <MyNotesSection />
      </div>
    </DashboardRefreshProvider>
  );
}
