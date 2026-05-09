import { NextResponse } from "next/server";
import { RevenueCatBillingProvider } from "@/lib/billing/RevenueCatBillingProvider";

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "RevenueCat webhook secret not configured" },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization") || "";
    const expectedAuth = `Bearer ${webhookSecret}`;

    if (authorization !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Avoid module-level singletons here; Next.js build/evaluation can be sensitive
    // to edge/runtime/module evaluation ordering.
    const rcProvider = new RevenueCatBillingProvider();
    await rcProvider.handleWebhook(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RevenueCat Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
