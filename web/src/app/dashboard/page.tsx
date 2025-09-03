import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { NewNoteSection, MyNotesSection } from "@/components/dashboard";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="py-6 px-8 h-full space-y-8 bg-stone-100  dark:bg-stone-950">
      <NewNoteSection />
      <MyNotesSection />
    </div>
  );
}
