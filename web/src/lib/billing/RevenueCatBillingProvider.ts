import type { BillingProvider as PrismaBillingProvider } from "@prisma/client";
import type {
  SubscriptionCreateParams,
  InternalPlanId,
  RCStore,
  SubscriptionStatusResult,
  RevenueCatWebhookEvent,
  RevenueCatWebhookEntitlement,
  RevenueCatWebhookSubscription,
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

type RCWebhookEvent = RevenueCatWebhookEvent;
type RCWebhookEntitlement = RevenueCatWebhookEntitlement;
type RCWebhookSubscription = RevenueCatWebhookSubscription;

export class RevenueCatBillingProvider {
  readonly provider: PrismaBillingProvider = "REVENUECAT";

  async handleWebhook(event: RCWebhookEvent): Promise<void> {
    const eventType = event.event.type;
    const appUserId = event.subscriber.original_app_user_id;
    const productId = event.product?.id ?? this.resolveProductIdFromEvent(event);

    if (!appUserId) {
      console.error("[RevenueCat] Missing original_app_user_id in webhook");
      return;
    }

    if (!productId) {
      console.warn("[RevenueCat] No product ID resolved for event", event.event.id);
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
        await this.handleUncancellation(appUserId, event);
        break;
      case RC_WEBHOOK_EVENTS.EXPIRATION:
        await this.handleExpiration(appUserId, event);
        break;
      case RC_WEBHOOK_EVENTS.BILLING_ISSUE:
        await this.handleBillingIssue(appUserId, event);
        break;
      case RC_WEBHOOK_EVENTS.PRODUCT_CHANGE:
        await this.handleProductChange(appUserId, productId, event);
        break;
      case RC_WEBHOOK_EVENTS.TRANSFER:
        await this.handleTransfer(appUserId, event);
        break;
      case RC_WEBHOOK_EVENTS.TEST:
        console.log("[RevenueCat] Test webhook received:", event.event.id);
        break;
      default:
        console.log("[RevenueCat] Unhandled webhook event type:", eventType);
    }
  }

  async syncSubscriptionWithProvider(userId: string): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (subscription && subscription.provider === "PADDLE") return;
    // For RC, we rely on webhooks. If there's a stale RC subscription, keep it.
  }

  async createSubscription(params: SubscriptionCreateParams): Promise<void> {
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
    event: RCWebhookEvent
  ): Promise<void> {
    const internalPlanId = resolveInternalPlanIdFromRCWebhookEventProduct(productId);
    const planConfig = getInternalPlanConfig(internalPlanId);
    const subData = this.getActiveSubscription(event);
    const originalTxId = subData?.original_transaction_id ?? null;
    const store = (subData?.store ?? event.product?.store ?? "APP_STORE") as RCStore;
    const entitlement = this.getActiveEntitlement(event);

    const expiresDate = subData?.expires_date
      ? new Date(subData.expires_date)
      : entitlement?.expires_date
        ? new Date(entitlement.expires_date)
        : null;
    const purchaseDate = subData?.purchase_date
      ? new Date(subData.purchase_date)
      : entitlement?.purchase_date
        ? new Date(entitlement.purchase_date)
        : new Date();
    const trialEnd = subData?.period_type === "TRIAL" ? expiresDate : null;

    const isSandbox = event.event.environment === "SANDBOX";

    const { PRO_PLAN_LIMITS } = await import("@/lib/config/subscription-limits");

    await SubscriptionService.upsertSubscription(
      {
        userId: appUserId,
        provider: "REVENUECAT",
        priceId: productId,
        internalPlanId: internalPlanId ?? undefined,
        status: "ACTIVE",
        currentPeriodStart: purchaseDate,
        currentPeriodEnd: expiresDate ?? undefined,
        nextBillingDate: expiresDate ?? undefined,
        trialEnd: trialEnd ?? undefined,
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
          event_id: event.event.id,
        },
      }
    );

    // Sync Loops for email marketing
    try {
      const { updateLoopsContact } = await import("@/lib/loops");
      const user = await SubscriptionService.getUserEmail(appUserId);
      if (user?.email) {
        await updateLoopsContact({ email: user.email, plan: "pro" });
      }
    } catch {
      // Loops sync is best-effort
    }
  }

  private async handleRenewal(appUserId: string, event: RCWebhookEvent): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    const subData = this.getActiveSubscription(event);
    const entitlement = this.getActiveEntitlement(event);

    const expiresDate = subData?.expires_date
      ? new Date(subData.expires_date)
      : entitlement?.expires_date
        ? new Date(entitlement.expires_date)
        : undefined;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      status: "ACTIVE",
      currentPeriodEnd: expiresDate,
      nextBillingDate: expiresDate ?? null,
    });

    if (expiresDate) {
      await SubscriptionService.resetUsageCounters(appUserId);
    }
  }

  private async handleCancellation(appUserId: string, event: RCWebhookEvent): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    const entitlement = this.getActiveEntitlement(event);
    const willExpire = !!entitlement?.expires_date;
    const expiresDate = entitlement?.expires_date ? new Date(entitlement.expires_date) : undefined;

    if (willExpire && expiresDate && expiresDate > new Date()) {
      await SubscriptionService.updateSubscriptionByUserId(appUserId, {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: expiresDate,
      });
    } else {
      await SubscriptionService.updateSubscriptionByUserId(appUserId, {
        status: "CANCELLED",
        cancelledAt: new Date(),
      });
      // Sync Loops
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

  private async handleUncancellation(appUserId: string, _event: RCWebhookEvent): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      cancelAtPeriodEnd: false,
      status: "ACTIVE",
    });
  }

  private async handleExpiration(appUserId: string, _event: RCWebhookEvent): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      status: "EXPIRED",
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

  private async handleBillingIssue(appUserId: string, _event: RCWebhookEvent): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      status: "PAST_DUE",
    });
  }

  private async handleProductChange(
    appUserId: string,
    productId: string,
    event: RCWebhookEvent
  ): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(appUserId);
    if (!subscription || subscription.provider !== "REVENUECAT") return;

    const internalPlanId = resolveInternalPlanIdFromRCWebhookEventProduct(productId);
    const planConfig = getInternalPlanConfig(internalPlanId);
    const subData = this.getActiveSubscription(event);

    await SubscriptionService.updateSubscriptionByUserId(appUserId, {
      priceId: productId,
      internalPlanId: internalPlanId ?? undefined,
      rcProductId: productId,
      amount: planConfig?.amount ?? undefined,
      currentPeriodEnd: subData?.expires_date ? new Date(subData.expires_date) : undefined,
      nextBillingDate: subData?.expires_date ? new Date(subData.expires_date) : null,
    });
  }

  private async handleTransfer(appUserId: string, event: RCWebhookEvent): Promise<void> {
    // When a user transfers from one App Store account to another
    const subData = this.getActiveSubscription(event);
    if (subData?.original_transaction_id) {
      await SubscriptionService.updateSubscriptionByUserId(appUserId, {
        rcOriginalTransactionId: subData.original_transaction_id,
      });
    }
  }

  private getActiveSubscription(event: RCWebhookEvent): RCWebhookSubscription | null {
    const subs = event.subscriber.subscriptions;
    if (!subs) return null;
    // Return the first active/valid subscription
    for (const [, sub] of Object.entries(subs)) {
      const expiresAt = new Date(sub.expires_date);
      if (expiresAt > new Date()) return sub;
    }
    // Fallback: return the first one
    const values = Object.values(subs);
    return values.length > 0 ? values[0] : null;
  }

  private getActiveEntitlement(event: RCWebhookEvent): RCWebhookEntitlement | null {
    const entitlements = event.subscriber.entitlements;
    if (!entitlements) return null;
    const rcEntitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || "pro";
    return entitlements[rcEntitlementId] ?? Object.values(entitlements)[0] ?? null;
  }

  private resolveProductIdFromEvent(event: RCWebhookEvent): string {
    const sub = this.getActiveSubscription(event);
    if (sub?.product_id) return sub.product_id;
    const entitlement = this.getActiveEntitlement(event);
    if (entitlement?.product_identifier) return entitlement.product_identifier;
    return "";
  }
}

function resolveInternalPlanIdFromRCWebhookEventProduct(productId: string): InternalPlanId | null {
  return resolveInternalPlanIdFromRCProductId(productId);
}
