import { NextResponse, type NextRequest } from "next/server";
import { getUserFromAuth } from "@/lib/auth-helper";
import { SubscriptionService } from "@/lib/subscription-service";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      entitlementId,
      productId,
      store,
      originalTransactionId,
      isActive,
      expiresDate,
      purchaseDate,
      managementUrl,
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Missing required field: productId" },
        { status: 400 }
      );
    }

    const existing = await SubscriptionService.getUserSubscription(userId);

    if (existing && existing.provider === "PADDLE" && existing.status === "ACTIVE") {
      return NextResponse.json({
        synced: false,
        message: "User already has an active Paddle subscription",
        subscription: existing,
      });
    }

    const isSandbox = process.env.REVENUECAT_ENVIRONMENT === "sandbox";
    const expires = expiresDate ? new Date(expiresDate) : undefined;
    const purchased = purchaseDate ? new Date(purchaseDate) : new Date();

    const { resolveInternalPlanIdFromRCProductId } = await import("@/lib/billing");
    const internalPlanId = resolveInternalPlanIdFromRCProductId(productId) ?? undefined;

    const { PRO_PLAN_LIMITS } = await import("@/lib/config/subscription-limits");

    await SubscriptionService.upsertSubscription({
      userId,
      provider: "REVENUECAT",
      priceId: productId,
      internalPlanId,
      status: isActive !== false ? "ACTIVE" : "CANCELLED",
      currentPeriodStart: purchased,
      currentPeriodEnd: expires,
      nextBillingDate: expires,
      amount: undefined,
      notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
      coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
      pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
      videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
      audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
      rcOriginalTransactionId:
        typeof originalTransactionId === "string" && originalTransactionId.trim().length > 0
          ? originalTransactionId.trim()
          : undefined,
      rcProductId: productId,
      rcStore: (store as string) ?? "APP_STORE",
      metadata: {
        entitlement_id: entitlementId,
        management_url: managementUrl,
        environment: isSandbox ? "sandbox" : "production",
        synced_at: new Date().toISOString(),
      },
    });

    const updated = await SubscriptionService.getUserSubscription(userId);

    return NextResponse.json({
      synced: true,
      subscription: updated,
    });
  } catch (error) {
    console.error("[RevenueCat Sync] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync RevenueCat subscription" },
      { status: 500 }
    );
  }
}
