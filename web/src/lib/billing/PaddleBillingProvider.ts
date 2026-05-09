import type { BillingProvider as PrismaBillingProvider } from "@prisma/client";
import type {
  SubscriptionCreateParams,
  InternalPlanId,
  SubscriptionStatusResult,
} from "./types";
import { resolveInternalPlanIdFromPaddlePriceId, getPaddlePriceId } from "./plan-mapping";
import { SubscriptionService } from "../subscription-service";
import { PaddleSubscriptionService, PADDLE_CONFIG } from "../payments/paddle";

export class PaddleBillingProvider {
  readonly provider: PrismaBillingProvider = "PADDLE";

  async createSubscription(params: SubscriptionCreateParams): Promise<void> {
    const paddleSubId = params.paddleSubscriptionId!;
    const internalPlanId =
      params.internalPlanId ?? resolveInternalPlanIdFromPaddlePriceId(params.priceId) ?? undefined;

    await SubscriptionService.createSubscription({
      userId: params.userId,
      provider: "PADDLE",
      paddleSubscriptionId: paddleSubId,
      priceId: params.priceId,
      internalPlanId,
      status: params.status ?? "PENDING",
      currentPeriodStart: params.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd,
      nextBillingDate: params.nextBillingDate,
      trialEnd: params.trialEnd,
      metadata: params.metadata,
      amount: params.amount,
    });
  }

  async cancelSubscription(userId: string, cancelAtPeriodEnd = true): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (!subscription || !subscription.paddleSubscriptionId) {
      throw new Error("No Paddle subscription found");
    }

    if (subscription.status === "CANCELLED") {
      throw new Error("Subscription is already cancelled");
    }

    const metadata = (subscription.metadata as Record<string, unknown>) || {};
    if (metadata.scheduledPriceId) {
      delete metadata.scheduledPriceId;
      delete metadata.scheduledPlanType;
      delete metadata.scheduledAt;
      await SubscriptionService.updateSubscriptionMetadata(
        subscription.paddleSubscriptionId,
        metadata as Record<string, unknown>
      );
    }

    const effectiveFrom = cancelAtPeriodEnd ? "next_billing_period" : ("immediately" as const);
    const cancelResult = await PaddleSubscriptionService.cancelSubscription(
      subscription.paddleSubscriptionId,
      effectiveFrom
    );

    if (!cancelResult.success) {
      throw new Error(cancelResult.error || "Failed to cancel subscription");
    }

    if (cancelAtPeriodEnd) {
      await SubscriptionService.updateSubscriptionCancelState(
        subscription.paddleSubscriptionId,
        true
      );
    } else {
      await SubscriptionService.updateSubscriptionStatus(
        subscription.paddleSubscriptionId,
        "CANCELLED",
        { nextBillingDate: null, cancelledAt: new Date(), cancelAtPeriodEnd: false }
      );
    }
  }

  async reactivateSubscription(userId: string): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (!subscription || !subscription.paddleSubscriptionId) {
      throw new Error("No Paddle subscription found");
    }

    if (subscription.status !== "ACTIVE" || !subscription.cancelAtPeriodEnd) {
      throw new Error("Only subscriptions cancelled at period end can be reactivated");
    }

    const reactivateResult = await PaddleSubscriptionService.reactivateSubscription(
      subscription.paddleSubscriptionId
    );

    if (!reactivateResult.success) {
      throw new Error(reactivateResult.error || "Failed to reactivate subscription");
    }

    await SubscriptionService.updateSubscriptionCancelState(
      subscription.paddleSubscriptionId,
      false
    );
  }

  async changePlan(
    userId: string,
    targetInternalPlanId: InternalPlanId,
    immediate = true
  ): Promise<void> {
    const subscription = await SubscriptionService.getSubscriptionWithSync(userId);
    if (!subscription || !subscription.paddleSubscriptionId) {
      throw new Error("No Paddle subscription found");
    }

    const paddleSubscription = await PaddleSubscriptionService.getSubscription(
      subscription.paddleSubscriptionId
    );

    if (!paddleSubscription) {
      throw new Error("Could not verify subscription status");
    }

    if (
      paddleSubscription.status !== "active" &&
      paddleSubscription.status !== "trialing"
    ) {
      throw new Error(
        `Subscription must be active to change plans. Current status: ${paddleSubscription.status}`
      );
    }

    const currentPriceId = paddleSubscription.items?.[0]?.price?.id;
    if (!currentPriceId) {
      throw new Error("Could not determine current plan");
    }

    const targetPriceId = this.getPaddlePriceIdForPlan(targetInternalPlanId);

    if (immediate) {
      const changeResult = await PaddleSubscriptionService.changePlan(
        subscription.paddleSubscriptionId,
        targetPriceId,
        "prorated_immediately"
      );

      if (!changeResult.success) {
        throw new Error(changeResult.error || "Failed to change subscription plan");
      }

      await SubscriptionService.updateSubscriptionPriceId(
        subscription.paddleSubscriptionId,
        targetPriceId,
        targetInternalPlanId
      );
    } else {
      const metadata = (subscription.metadata as Record<string, unknown>) || {};
      delete metadata.scheduledPriceId;
      delete metadata.scheduledPlanType;
      delete metadata.scheduledAt;

      await SubscriptionService.updateSubscriptionMetadata(
        subscription.paddleSubscriptionId,
        {
          ...metadata,
          scheduledPriceId: targetPriceId,
          scheduledPlanType: targetInternalPlanId,
          scheduledAt: new Date().toISOString(),
        }
      );
    }
  }

  async handleWebhook(_body: unknown, _headers: Record<string, string>): Promise<void> {
    throw new Error(
      "Paddle webhooks are handled by the dedicated /api/webhook/paddle route. Use that instead."
    );
  }

  async syncSubscriptionWithProvider(userId: string): Promise<void> {
    await SubscriptionService.getSubscriptionWithSync(userId);
  }

  async getCheckoutData(params: {
    userId: string;
    userEmail: string;
    billingInterval: "monthly" | "yearly";
    discountCode?: string;
  }) {
    const { userId, userEmail, billingInterval, discountCode } = params;

    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);
    if (existingSubscription) {
      if (existingSubscription.status === "ACTIVE") {
        throw new Error("You already have an active subscription");
      }
      if (["CANCELLED", "FAILED", "EXPIRED", "PENDING"].includes(existingSubscription.status)) {
        try {
          await SubscriptionService.deleteSubscription(userId);
        } catch {
          // stale record may already be gone
        }
      }
    }

    const priceId = this.getPaddlePriceIdForPlan(
      billingInterval === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY"
    );

    return {
      priceId,
      clientToken: PADDLE_CONFIG.clientToken,
      environment: PADDLE_CONFIG.environment,
      customerEmail: userEmail,
      customData: { userId },
      discountCode,
      returnUrl: PADDLE_CONFIG.returnUrl,
    };
  }

  async getPortalUrl(userId: string): Promise<string> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (!subscription || !subscription.paddleSubscriptionId) {
      throw new Error("No subscription found");
    }

    const user = await SubscriptionService.getUserWithPaddleId(userId);
    const customerId = user?.paddleCustomerId;

    if (!customerId) {
      throw new Error("No Paddle customer ID found");
    }

    const portalResult = await PaddleSubscriptionService.getPortalUrl(
      customerId,
      subscription.paddleSubscriptionId
    );

    if (!portalResult) {
      throw new Error("Failed to create customer portal session");
    }

    return portalResult;
  }

  async getSubscriptionInfo(userId: string): Promise<SubscriptionStatusResult> {
    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return {
        hasSubscription: false,
        provider: null,
        status: null,
        internalPlanId: null,
        priceId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        nextBillingDate: null,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        trialEnd: null,
        amount: null,
        daysRemaining: null,
        isActive: false,
        isTrial: false,
        displayStatus: "No Subscription",
      };
    }

    const displayInfo = SubscriptionService.getSubscriptionDisplayInfo(subscription);

    return {
      hasSubscription: true,
      provider: subscription.provider,
      status: subscription.status,
      internalPlanId: (subscription.internalPlanId as InternalPlanId) ?? null,
      priceId: subscription.priceId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt,
      trialEnd: subscription.trialEnd,
      amount: subscription.amount,
      daysRemaining: displayInfo.daysRemaining,
      isActive: displayInfo.isActive,
      isTrial: displayInfo.isTrial,
      displayStatus: displayInfo.displayStatus,
    };
  }

  private getPaddlePriceIdForPlan(planId: InternalPlanId): string {
    return getPaddlePriceId(planId);
  }
}
