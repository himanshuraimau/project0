import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Cards */}
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Overview</h3>
            <p className="text-muted-foreground">
              Your account overview and statistics
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
            <p className="text-muted-foreground">
              Your latest activities and updates
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Settings</h3>
            <p className="text-muted-foreground">
              Manage your account preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
