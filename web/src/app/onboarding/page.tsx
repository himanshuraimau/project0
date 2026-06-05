import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function OnboardingIndex() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const onboarding = await prisma.userOnboarding.findUnique({
    where: { userId: session.user.id },
    select: { isCompleted: true, currentStep: true },
  });

  if (onboarding?.isCompleted) {
    redirect("/dashboard");
  }

  const step = Math.min(Math.max(onboarding?.currentStep ?? 1, 1), 5);
  redirect(`/onboarding/step${step}`);
}
