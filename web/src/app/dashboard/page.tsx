import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NewNoteSection, MyNotesSection } from "@/components/dashboard";
import { FreeTierWarning } from "@/components/subscription";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check if user has completed onboarding
  const onboarding = await prisma.userOnboarding.findUnique({
    where: { userId: session.user.id },
    select: { isCompleted: true },
  });

  // Redirect to onboarding if not completed
  if (!onboarding || !onboarding.isCompleted) {
    redirect("/onboarding/step1");
  }

  return (
    <div className="w-full space-y-12">
      <FreeTierWarning />
      <NewNoteSection />
      <MyNotesSection />
    </div>
  );
}
