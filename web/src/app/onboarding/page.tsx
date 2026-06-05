import { redirect } from "next/navigation";

export default function OnboardingIndex() {
  redirect("/auth/redirect");
}
