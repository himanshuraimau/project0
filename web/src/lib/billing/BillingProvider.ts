import type { BillingProvider } from "@prisma/client";
import type { SubscriptionCreateParams, InternalPlanId } from "./types";

export interface BillingProviderDefinition {
  readonly provider: BillingProvider;

  createSubscription(params: SubscriptionCreateParams): Promise<void>;

  cancelSubscription(userId: string, cancelAtPeriodEnd?: boolean): Promise<void>;

  reactivateSubscription(userId: string): Promise<void>;

  changePlan(
    userId: string,
    targetInternalPlanId: InternalPlanId,
    immediate?: boolean
  ): Promise<void>;

  handleWebhook(body: unknown, headers: Record<string, string>): Promise<void>;

  syncSubscriptionWithProvider(userId: string): Promise<void>;

  getSubscriptionInfo?(userId: string): Promise<unknown>;
}
