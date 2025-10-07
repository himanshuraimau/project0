import { redirect } from "next/navigation"

// Success page from old credit system - redirecting to dashboard
export default async function SuccessPage() {
  redirect("/dashboard")
}
