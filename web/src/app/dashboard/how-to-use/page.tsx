import { redirect } from "next/navigation"
import { auth } from "@/lib/auth";
import { headers } from "next/headers"
import { DashboardLayout } from "@/components/dashboard"
import { Card } from "@/components/ui/card"
import { YouTubePlayer } from "@/components/course/YouTubePlayer"

export default async function HowToUsePage() {
  const session = await auth.api.getSession({ headers: await headers() }); const userId = session?.user?.id
  
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            How to Use
          </h1>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Get started in 20 seconds
          </h2>
        </div>

        <Card className="rounded-3xl border-0 p-8 ">
          <div className="space-y-6">    
            <div className="max-w-6xl mx-auto">
              <YouTubePlayer
                videoId="dQw4w9WgXcQ"
                title="How to use Project0"
                className="rounded-2xl overflow-hidden"
              />
            </div>
            
            <div className="prose prose-neutral max-w-none">
              <p className="text-muted-foreground">
                This quick overview video will walk you through the platform's core features and help you get started with creating and managing your notes efficiently.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
