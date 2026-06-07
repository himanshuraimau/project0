import type { BillingProvider as PrismaBillingProvider } from "@prisma/client";
import type {
  SubscriptionCreateParams,
  InternalPlanId,
  RCStore,
  SubscriptionStatusResult,
  RevenueCatWebhookPayload,
  RevenueCatWebhookEvent,
} from "./types";
import {
  resolveInternalPlanIdFromRCProductId,
  getInternalPlanConfig,
} from "./plan-mapping";
import { SubscriptionService } from "../subscription-service";

const RC_WEBHOOK_EVENTS = {
  INITIAL_PURCHASE: "INITIAL_PURCHASE",
  RENEWAL: "RENEWAL",
  CANCELLATION: "CANCELLATION",
  UNCANCELLATION: "UNCANCELLATION",
  EXPIRATION: "EXPIRATION",
  BILLING_ISSUE: "BILLING_ISSUE",
  PRODUCT_CHANGE: "PRODUCT_CHANGE",
  TRANSFER: "TRANSFER",
  SUBSCRIBER_ALIAS: "SUBSCRIBER_ALIAS",
  TEST: "TEST",
} as const;

export class RevenueCatBillingProvider {
  readonly provider: PrismaBillingProvider = "REVENUECAT";

  async handleWebhook(payload: RevenueCatWebhookPayload): Promise<void> {
    const event: RevenueCatWebhookEvent =
      (payload as any).event ?? (payload as unknown as RevenueCatWebhookEvent);

    const eventType = event.type;

    const appUserId =
      event.app_user_id ||
      event.original_app_user_id ||
      event.aliases?.find(Boolean) ||
      "";

    if (!appUserId) {
      console.error("[RevenueCat] Missing app_user_id in webhook", { eventId: event.id, type: eventType });
      return;
    }

    const ourEntitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || "pro";
    if (
      event.entitlement_ids &&
      event.entitlement_ids.length > 0 &&
      !event.entitlement_ids.includes(ourEntitlementId)
    ) {
      console.log("[RevenueCat] Ignoring event for unrelated entitlement", {
        type: eventType,
        entitlement_ids: event.entitlement_ids,
      });
      return;
    }

    const productId = event.product_id ?? "";

    if (!productId && eventType !== RC_WEBHOOK_EVENTS.TEST) {
      console.warn("[RevenueCat] No product_id in event", { eventId: event.id, type: eventType });
    }

    switch (eventType) {
      case RC_WEBHOOK_EVENTS.INITIAL_PURCHASE:
        await this.handleInitialPurchase(appUserId, productId, event);
        break;
      case RC_WEBHOOK_EVENTS.RENEWAL:
        await this.handleRenewal(appUserId, event);
        break;
      case RC_WEBHOOK_EVENTS.CANCELLATION:
        await this.handleCancellation(appUserId, event);
        break;
      case RC_WEBHOOK_EVENTS.UNCANCELLATION:
        await this.handleUncancellation(appUserId);
        break;
      case RC_WEBHOOK_EVENTS.EXPIRATION:
        await this.handleExpiration(appUserId, event);
        break;
      case RC_WEBHOOK_EVENTS.BILLING_ISSUE:
        await this.handleBillingIssue(appUserId);
        break;
      case RC_WEBHOOK_EVENTS.PRODUCT_CHANGE:
        await this.handleProductChange(appUserId, productId, event);
        break;
      case RC_WEBHOOK_EVENTS.TRANSFER:
        await this.handleTransfer(appUserId, event);
        break;
      case RC_WEBHOOK_EVENTS.TEST:
        console.log("[RevenueCat] Test webhook received:", event.id);
        break;
      default:
        console.log("[RevenueCat] Unhandled webhook event type:", eventType);
    }
  }

  async syncSubscriptionWithProvider(userId: string): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (subscription && subscription.provider === "PADDLE") return;
  }

  async createSubscription(_params: SubscriptionCreateParams): Promise<void> {
    throw new Error("RevenueCat subscriptions are created via Apple IAP. Use handleWebhook instead.");
  }

  async cancelSubscription(_userId: string): Promise<void> {
    throw new Error("RevenueCat subscriptions are cancelled via Apple IAP. Cancellation is handled via webhook.");
  }

  async reactivateSubscription(_userId: string): Promise<void> {
    throw new Error("RevenueCat subscriptions are reactivated via Apple IAP. Reactivation is handled via webhook.");
  }

  async changePlan(_userId: string, _targetPlan: InternalPlanId): Promise<void> {
    throw new Error("RevenueCat plan changes happen via Apple IAP. Changes are handled via webhook.");
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

  private async handleInitialPurchase(
    appUserId: string,
    productId: string,
    event: RevenueCatWebhookEvent
  ): Promise<void> {
    const internalPlanId = resolveInternalPlanIdFromRCProductId(productId);
    const planConfig = getInternalPlanConfig(internalPlanId);

    const expiresDate = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const purchaseDate = event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date();
    const isTrial = event.period_type === "TRIAL" || event.period_type === "INTRO";
    const isSandbox = event.environment === "SANDBOX";
    const store = (event.store ?? "APP_STORE") as RCStore;
    const originalTxId = event.original_transaction_id ?? null;

    const { PRO_PLAN_LIMITS } = await import("@/lib/config/subscription-limits");

    await SubscriptionService.upsertSubscription({
      userId: appUserId,
      provider: "REVENUECAT",
      priceId: productId,
      internalPlanId: internalPlanId ?? undefined,
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      currentPeriodStart: purchaseDate,
      currentPeriodEnd: expiresDate ?? undefined,
      nextBillingDate: expiresDate ?? undefined,
      trialEnd: isTrial ? (expiresDate ?? undefined) : undefined,
      amount: planConfig?.amount,
      rcOriginalTransactionId: originalTxId ?? undefined,
      rcProductId: productId,
      rcStore: store,
      notesPerMonth: PRO_PLAN_LIMITS.notesPerMonth,
      coursesPerMonth: PRO_PLAN_LIMITS.coursesPerMonth,
      pdfProcessingPerMonth: PRO_PLAN_LIMITS.pdfProcessingPerMonth,
      videoProcessingPerMonth: PRO_PLAN_LIMITS.videoProcessingPerMonth,
      audioProcessingPerMonth: PRO_PLAN_LIMITS.audioProcessingPerMonth,
      metadata: {
        environment: isSandbox ? "sandbox" : "production",
        event_id: event.id,
      },
    });

    try {
      const { updateLoopsContact } = await import("@/lib/loops");
      const user = await SubscriptionService.getUserEmail(appUserId);
      if (user?.email) {
        await updateLoopsContact({ email: user.email, plan: "pro" });
      }
    } catch {
      // best-effort
    }
  }

  private async handleRenewal(appUserId: string, event: RevenueCatWebhookEvent): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    const expiresDate = event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      status: "ACTIVE",
      currentPeriodEnd: expiresDate,
      nextBillingDate: expiresDate ?? null,
    });

    if (expiresDate) {
      await SubscriptionService.resetUsageCounters(appUserId);
    }
  }

  private async handleCancellation(appUserId: string, event: RevenueCatWebhookEvent): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    const expiresDate = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const willExpire = expiresDate !== null && expiresDate > new Date();

    if (willExpire && expiresDate) {
      await SubscriptionService.updateSubscriptionByUserId(appUserId, {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: expiresDate,
      });
    } else {
      await SubscriptionService.updateSubscriptionByUserId(appUserId, {
        status: "CANCELLED",
        cancelledAt: new Date(),
      });
      try {
        const { updateLoopsContact } = await import("@/lib/loops");
        const user = await SubscriptionService.getUserEmail(appUserId);
        if (user?.email) {
          await updateLoopsContact({ email: user.email, plan: "free" });
        }
      } catch {
        // best-effort
      }
    }
  }

  private async handleUncancellation(appUserId: string): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      cancelAtPeriodEnd: false,
      status: "ACTIVE",
    });
  }

  private async handleExpiration(appUserId: string, event: RevenueCatWebhookEvent): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    const expiresDate = event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      status: "EXPIRED",
      currentPeriodEnd: expiresDate,
    });

    try {
      const { updateLoopsContact } = await import("@/lib/loops");
      const user = await SubscriptionService.getUserEmail(appUserId);
      if (user?.email) {
        await updateLoopsContact({ email: user.email, plan: "free" });
      }
    } catch {
      // best-effort
    }
  }

  private async handleBillingIssue(appUserId: string): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      status: "PAST_DUE",
    });
  }

  private async handleProductChange(
    appUserId: string,
    productId: string,
    event: RevenueCatWebhookEvent
  ): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    const internalPlanId = resolveInternalPlanIdFromRCProductId(productId);
    const planConfig = getInternalPlanConfig(internalPlanId);
    const expiresDate = event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      priceId: productId,
      internalPlanId: internalPlanId ?? undefined,
      rcProductId: productId,
      amount: planConfig?.amount ?? undefined,
      currentPeriodEnd: expiresDate,
      nextBillingDate: expiresDate ?? null,
    });
  }

  private async handleTransfer(appUserId: string, event: RevenueCatWebhookEvent): Promise<void> {
    if (event.original_transaction_id) {
      await SubscriptionService.updateSubscriptionByUserId(appUserId, {
        rcOriginalTransactionId: event.original_transaction_id,
      });
    }
  }
}
