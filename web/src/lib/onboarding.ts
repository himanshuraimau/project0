import { prisma } from "@/lib/prisma";

export async function getUserOnboardingStatus(userId: string) {
  const onboarding = await prisma.userOnboarding.findUnique({
    where: { userId },
    select: {
      id: true,
      isCompleted: true,
      currentStep: true,
      source: true,
      userType: true,
      role: true,
      features: true,
      studyIntensity: true,
      completedAt: true,
    },
  });

  return onboarding;
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const onboarding = await prisma.userOnboarding.findUnique({
    where: { userId },
    select: { isCompleted: true },
  });

  return onboarding?.isCompleted ?? false;
}
