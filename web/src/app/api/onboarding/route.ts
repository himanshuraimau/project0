import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { updateLoopsContact, sendLoopsEvent } from "@/lib/loops";

// GET - Check if user completed onboarding
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        isCompleted: true,
        currentStep: true,
        source: true,
        sourceDetail: true,
        userType: true,
        role: true,
        features: true,
        studyIntensity: true,
        wantsProductUpdates: true,
        completedAt: true,
      },
    });

    return NextResponse.json({ onboarding });
  } catch (error) {
    console.error("Error fetching onboarding:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    );
  }
}

// POST - Save onboarding progress or complete onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      source,
      sourceDetail,
      userType,
      role,
      features,
      studyIntensity,
      currentStep,
      isCompleted,
      wantsProductUpdates,
    } = body;

    const cleanedSourceDetail =
      typeof sourceDetail === "string"
        ? sourceDetail.trim().slice(0, 200) || null
        : sourceDetail === null
          ? null
          : undefined;

    // Upsert onboarding data
    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId: session.user.id },
      update: {
        ...(source !== undefined && { source: source ?? null }),
        ...(cleanedSourceDetail !== undefined && { sourceDetail: cleanedSourceDetail }),
        ...(userType !== undefined && { userType: userType ?? null }),
        ...(role !== undefined && { role: role ?? null }),
        ...(features !== undefined && { features }),
        ...(studyIntensity !== undefined && { studyIntensity: studyIntensity ?? null }),
        ...(currentStep !== undefined && { currentStep }),
        ...(wantsProductUpdates !== undefined && { wantsProductUpdates: !!wantsProductUpdates }),
        ...(isCompleted !== undefined && {
          isCompleted,
          ...(isCompleted && { completedAt: new Date() }),
        }),
      },
      create: {
        userId: session.user.id,
        source: source || null,
        sourceDetail: cleanedSourceDetail ?? null,
        userType: userType || null,
        role: role || null,
        features: features || null,
        studyIntensity: studyIntensity || null,
        currentStep: currentStep || 1,
        isCompleted: isCompleted || false,
        wantsProductUpdates: wantsProductUpdates !== false,
        ...(isCompleted && { completedAt: new Date() }),
      },
    });

    // Sync to Loops when onboarding is completed (for email marketing segments)
    if (isCompleted && session.user.email) {
      const name = session.user.name?.trim() || "";
      const [firstName, ...lastParts] = name.split(/\s+/);
      const lastName = lastParts.join(" ") || undefined;
      const result = await updateLoopsContact({
        email: session.user.email,
        userId: session.user.id,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        source: "flinote_onboarding",
        subscribed: wantsProductUpdates !== false,
        plan: "free",
        referralSource: source || undefined,
        referralSourceDetail: cleanedSourceDetail || undefined,
        userType: userType || undefined,
        role: role || undefined,
        studyIntensity: studyIntensity || undefined,
        features: Array.isArray(features) ? features.join(",") : undefined,
      });
      if (!result.success) {
        console.warn("Loops sync on onboarding complete:", result.message);
      }
      await sendLoopsEvent(session.user.email, "onboarding_completed", {
        source: source || "unknown",
        sourceDetail: cleanedSourceDetail || "",
        role: role || "unknown",
      });
    }

    return NextResponse.json({
      success: true,
      onboarding,
    });
  } catch (error) {
    console.error("Error saving onboarding:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding data" },
      { status: 500 }
    );
  }
}
