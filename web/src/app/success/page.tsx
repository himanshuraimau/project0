import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { UserService } from "@/lib/user-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircleIcon, ZapIcon, ArrowRightIcon } from "lucide-react"
import Link from "next/link"

export default async function SuccessPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Get current user credits
  const user = await UserService.getOrCreateUser(userId)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg">
              Your credits have been added to your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Current Balance */}
            <div className="bg-muted/30 rounded-lg p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ZapIcon className="h-6 w-6 text-yellow-500" />
                <span className="text-lg font-semibold">Current Balance</span>
              </div>
              <div className="text-4xl font-bold text-primary">
                {user.creditBalance} Credits
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">What's next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="font-semibold mb-1">Upload PDFs</div>
                  <div className="text-muted-foreground">Process your documents</div>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="font-semibold mb-1">Create Notes</div>
                  <div className="text-muted-foreground">Generate summaries</div>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="font-semibold mb-1">Make Quizzes</div>
                  <div className="text-muted-foreground">Test your knowledge</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="flex items-center gap-2">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/credits">
                  Buy More Credits
                </Link>
              </Button>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Your credits never expire and can be used anytime. 
                Need help? <Link href="/dashboard/support" className="text-primary hover:underline">Contact support</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
