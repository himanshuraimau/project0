import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { NewNoteSection, MyNotesSection } from "@/components/dashboard"
import { CreditDisplay } from "@/components/credit-display"
import { UserService } from "@/lib/user-service"

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get current user credits
  const user = await UserService.getOrCreateUser(userId)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Welcome to your dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Create, organize, and manage your notes with ease
        </p>
      </div>

      {/* Credit Display */}
      <CreditDisplay initialCredits={user.creditBalance} />

      {/* New Note Section */}
      <NewNoteSection />
      <MyNotesSection />
    </div>
  );
}
