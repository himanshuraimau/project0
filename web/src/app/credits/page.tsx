import { redirect } from "next/navigation"

// Credit system has been replaced with subscription-based access
// Redirect all traffic to the pricing/subscription page
export default async function CreditPurchasePage() {
  redirect("/pricing")
}
