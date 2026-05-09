import type { BillingProvider as PrismaBillingProvider } from "@prisma/client";
import type { SubscriptionStatusResult, InternalPlanId } from "./types";
import { PaddleBillingProvider } from "./PaddleBillingProvider";
import { RevenueCatBillingProvider } from "./RevenueCatBillingProvider";
import { SubscriptionService } from "../subscription-service";

const paddleProvider = new PaddleBillingProvider();
const revenueCatProvider = new RevenueCatBillingProvider();

function getProvider(provider: PrismaBillingProvider) {
  switch (provider) {
    case "PADDLE":
      return paddleProvider;
    case "REVENUECAT":
      return revenueCatProvider;
    default:
      throw new Error(`Unknown billing provider: ${provider}`);
  }
}

export class BillingOrchestrator {
  static async getSubscriptionInfo(userId: string): Promise<SubscriptionStatusResult> {
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

    const provider = getProvider(subscription.provider);
    return provider.getSubscriptionInfo ? provider.getSubscriptionInfo(userId) : {
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
      daysRemaining: SubscriptionService.getDaysUntilEnd(subscription),
      isActive: subscription.status === 'ACTIVE',
      isTrial: SubscriptionService.isInTrialPeriod(subscription),
      displayStatus: SubscriptionService.getSubscriptionDisplayInfo(subscription).displayStatus,
    };
  }

  static async createSubscriptionFromWebhook(
    provider: PrismaBillingProvider,
    params: Parameters<typeof SubscriptionService.createSubscription>[0]
  ): Promise<void> {
    await SubscriptionService.createSubscription({
      ...params,
      provider,
    });
  }

  static async activateSubscriptionFromWebhook(
    provider: PrismaBillingProvider,
    paddleSubscriptionId: string | undefined,
    rcOriginalTxId: string | undefined,
    billingInfo: {
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      nextBillingDate: Date;
      status?: "ACTIVE";
    }
  ): Promise<void> {
    if (provider === "PADDLE" && paddleSubscriptionId) {
      await SubscriptionService.activateSubscription(paddleSubscriptionId, billingInfo);
    } else if (provider === "REVENUECAT" && rcOriginalTxId) {
      await SubscriptionService.updateSubscriptionByRCTransactionId(rcOriginalTxId, {
        status: "ACTIVE",
        ...billingInfo,
      });
    }
  }

  static async resetUsageCounters(userId: string): Promise<void> {
    await SubscriptionService.resetUsageCounters(userId);
  }

  static async getCheckoutData(params: {
    userId: string;
    userEmail: string;
    billingInterval: "monthly" | "yearly";
    discountCode?: string;
  }) {
    return paddleProvider.getCheckoutData(params);
  }

  static async getPortalUrl(userId: string): Promise<string> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (!subscription) throw new Error("No subscription found");

    if (subscription.provider === "REVENUECAT") {
      const metadata = subscription.metadata as Record<string, unknown> | null;
      const managementUrl =
        (metadata?.management_url as string | undefined) ||
        (metadata?.managementURL as string | undefined);
      if (managementUrl) return managementUrl;
      throw new Error("Manage your subscription in your Apple ID settings");
    }

    return paddleProvider.getPortalUrl(userId);
  }

  static async cancelSubscription(userId: string, cancelAtPeriodEnd = true): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (!subscription) throw new Error("No subscription found");

    const provider = getProvider(subscription.provider);
    await provider.cancelSubscription(userId, cancelAtPeriodEnd);
  }

  static async reactivateSubscription(userId: string): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (!subscription) throw new Error("No subscription found");

    const provider = getProvider(subscription.provider);
    await provider.reactivateSubscription(userId);
  }

  static async changePlan(
    userId: string,
    targetInternalPlanId: InternalPlanId,
    immediate = true
  ): Promise<void> {
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (!subscription) throw new Error("No subscription found");

    const provider = getProvider(subscription.provider);
    await provider.changePlan(userId, targetInternalPlanId, immediate);
  }
}

export { paddleProvider, revenueCatProvider };
