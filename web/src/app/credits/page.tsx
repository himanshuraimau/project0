import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { UserService } from "@/lib/user-service"
import { CreditPurchase } from "@/components/credit-purchase"

export default async function CreditPurchasePage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Get current user credits
  const user = await UserService.getOrCreateUser(userId)

  return (
    <div className="min-h-screen bg-background">
      <CreditPurchase currentCredits={user.creditBalance} />
    </div>
  )
}
