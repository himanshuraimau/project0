import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import type { Subscription, SubscriptionStatusResponse } from '@/lib/api/types';
import { SubscriptionStatus } from '@/lib/api/types';
import { getRevenueCatDefaultOfferingId, getRevenueCatEntitlementId } from './config';
import type { RevenueCatPlan } from './types';

function getDaysRemaining(expirationDate: string | null): number | null {
  if (!expirationDate) return null;

  const diffMs = new Date(expirationDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getCurrentRevenueCatOffering(
  offerings: PurchasesOfferings | null
): PurchasesOffering | null {
  if (!offerings) return null;

  const defaultOfferingId = getRevenueCatDefaultOfferingId();
  return offerings.all[defaultOfferingId] || offerings.current || null;
}

export function mapRevenueCatCustomerInfoToSubscription(
  customerInfo: CustomerInfo | null
): Subscription | null {
  if (!customerInfo) return null;

  const entitlementId = getRevenueCatEntitlementId();
  const entitlement =
    customerInfo.entitlements.active[entitlementId] ||
    customerInfo.entitlements.all[entitlementId] ||
    null;

  if (!entitlement) {
    return null;
  }

  return {
    id: entitlement.identifier,
    userId: customerInfo.originalAppUserId,
    providerSubscriptionId: entitlement.identifier,
    providerCustomerId: customerInfo.originalAppUserId,
    billingProvider: entitlement.store,
    entitlementId: entitlement.identifier,
    store: entitlement.store,
    environment: entitlement.isSandbox ? 'sandbox' : 'production',
    priceId: entitlement.productIdentifier,
    productId: entitlement.productIdentifier,
    status: entitlement.isActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.CANCELLED,
    currentPeriodStart: entitlement.latestPurchaseDate,
    currentPeriodEnd: entitlement.expirationDate || undefined,
    nextBillingDate: entitlement.willRenew ? entitlement.expirationDate || undefined : undefined,
    cancelAtPeriodEnd: !entitlement.willRenew,
    cancelledAt: entitlement.unsubscribeDetectedAt || undefined,
    trialEnd: entitlement.periodType === 'TRIAL' ? entitlement.expirationDate || undefined : undefined,
    metadata: {
      provider: entitlement.store,
      entitlementId: entitlement.identifier,
      environment: entitlement.isSandbox ? 'sandbox' : 'production',
      managementURL: customerInfo.managementURL,
      originalAppUserId: customerInfo.originalAppUserId,
      ownershipType: entitlement.ownershipType,
    },
    createdAt: customerInfo.firstSeen,
    updatedAt: customerInfo.requestDate,
  };
}

export function mapRevenueCatCustomerInfoToSubscriptionStatus(
  customerInfo: CustomerInfo | null
): SubscriptionStatusResponse {
  const subscription = mapRevenueCatCustomerInfoToSubscription(customerInfo);

  if (!customerInfo || !subscription) {
    return {
      hasSubscription: false,
      subscription: null,
      access: {
        hasAccess: false,
        isActive: false,
        isTrial: false,
        daysRemaining: null,
        reason: 'NO_SUBSCRIPTION',
      },
    };
  }

  const entitlementId = getRevenueCatEntitlementId();
  const entitlement = customerInfo.entitlements.all[entitlementId];
  const isActive = entitlement?.isActive ?? false;
  const isTrial = entitlement?.periodType === 'TRIAL';

  return {
    hasSubscription: true,
    subscription,
    access: {
      hasAccess: isActive,
      isActive,
      isTrial,
      daysRemaining: getDaysRemaining(entitlement?.expirationDate ?? null),
    },
  };
}

function calculateYearlySavings(
  monthlyPackage: PurchasesPackage | null,
  yearlyPackage: PurchasesPackage | null
) {
  if (!monthlyPackage || !yearlyPackage) return null;

  const monthlyPrice = monthlyPackage.product.price;
  const yearlyMonthlyEquivalent = yearlyPackage.product.pricePerMonth;

  if (!monthlyPrice || !yearlyMonthlyEquivalent || monthlyPrice <= yearlyMonthlyEquivalent) {
    return null;
  }

  const savings = Math.round(((monthlyPrice - yearlyMonthlyEquivalent) / monthlyPrice) * 100);
  return savings > 0 ? `Save ${savings}%` : null;
}

export function mapOfferingToRevenueCatPlans(offering: PurchasesOffering | null): RevenueCatPlan[] {
  const monthlyPackage = offering?.monthly ?? null;
  const yearlyPackage = offering?.annual ?? null;

  return [
    {
      id: 'plan_monthly',
      billingInterval: 'monthly',
      package: monthlyPackage,
      title: 'Monthly',
      price: monthlyPackage?.product.priceString || '$19.99',
      period: '/month',
      savings: null,
    },
    {
      id: 'plan_yearly',
      billingInterval: 'yearly',
      package: yearlyPackage,
      title: 'Yearly',
      price:
        yearlyPackage?.product.pricePerMonthString ||
        yearlyPackage?.product.priceString ||
        '$16.67',
      period: '/month',
      savings: calculateYearlySavings(monthlyPackage, yearlyPackage),
    },
  ];
}
