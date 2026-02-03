import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

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
        userType: true,
        role: true,
        features: true,
        studyIntensity: true,
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
      userType,
      role,
      features,
      studyIntensity,
      currentStep,
      isCompleted,
    } = body;

    // Upsert onboarding data
    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId: session.user.id },
      update: {
        ...(source && { source }),
        ...(userType && { userType }),
        ...(role && { role }),
        ...(features && { features }),
        ...(studyIntensity && { studyIntensity }),
        ...(currentStep && { currentStep }),
        ...(isCompleted !== undefined && { 
          isCompleted,
          ...(isCompleted && { completedAt: new Date() })
        }),
      },
      create: {
        userId: session.user.id,
        source: source || null,
        userType: userType || null,
        role: role || null,
        features: features || null,
        studyIntensity: studyIntensity || null,
        currentStep: currentStep || 1,
        isCompleted: isCompleted || false,
        ...(isCompleted && { completedAt: new Date() }),
      },
    });

    return NextResponse.json({ 
      success: true, 
      onboarding 
    });
  } catch (error) {
    console.error("Error saving onboarding:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding data" },
      { status: 500 }
    );
  }
}
