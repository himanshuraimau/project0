import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
        onboarding: {
          select: {
            isCompleted: true,
            currentStep: true,
            source: true,
            sourceDetail: true,
            userType: true,
            role: true,
            studyIntensity: true,
          },
        },
      },
    });

    const now = new Date();
    const list = users.map((u) => {
      const sub = u.subscription;
      const isActive = sub?.status === "ACTIVE";
      const periodEnd = sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd)
        : null;
      const hasAccess =
        isActive && (!sub?.cancelAtPeriodEnd || (periodEnd && periodEnd > now));
      return {
        id: u.id,
        name: u.name ?? null,
        email: u.email,
        image: u.image ?? null,
        role: u.role,
        createdAt: u.createdAt,
        isPremium: !!hasAccess,
         hasSubscription: !!sub,
        subscriptionStatus: sub?.status ?? null,
        onboarding: u.onboarding
          ? {
              isCompleted: u.onboarding.isCompleted,
              currentStep: u.onboarding.currentStep,
              source: u.onboarding.source,
              sourceDetail: u.onboarding.sourceDetail,
              userType: u.onboarding.userType,
              role: u.onboarding.role,
              studyIntensity: u.onboarding.studyIntensity,
            }
          : null,
      };
    });

    return NextResponse.json({ users: list });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
