import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { NewNoteSection, MyNotesSection } from "@/components/dashboard"

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

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

      {/* New Note Section */}
      <NewNoteSection />

      {/* My Notes Section */}
      <MyNotesSection />
    </div>
  )
}
