import Purchases, {
  type CustomerInfo,
  type MakePurchaseResult,
  type PurchasesPackage,
} from 'react-native-purchases';
import { getCurrentRevenueCatOffering } from './mapper';
import {
  getRevenueCatOfferings,
  getRevenueCatUnsupportedReason,
  isRevenueCatNativeSupported,
} from './sdk';
import { syncRevenueCatSubscription } from '@/lib/api/subscription';
import { getRevenueCatEntitlementId } from './config';

export function isRevenueCatPurchaseCancelled(error: unknown): boolean {
  return Boolean((error as { userCancelled?: boolean } | null)?.userCancelled);
}

function assertPurchasesAvailable(): void {
  if (!isRevenueCatNativeSupported()) {
    throw new Error(getRevenueCatUnsupportedReason() ?? 'In-app purchases are not available in this build.');
  }
}

export async function purchaseRevenueCatPackage(
  packageToPurchase: PurchasesPackage
): Promise<CustomerInfo> {
  assertPurchasesAvailable();
  const result: MakePurchaseResult = await Purchases.purchasePackage(packageToPurchase);
  await maybeSyncCustomerInfo(result.customerInfo, result.transaction.transactionIdentifier);
  return result.customerInfo;
}

export async function restoreRevenueCatPurchases(): Promise<CustomerInfo> {
  assertPurchasesAvailable();
  const info = await Purchases.restorePurchases();
  await maybeSyncCustomerInfo(info, undefined);
  return info;
}

export async function getRevenueCatPackages() {
  const offerings = await getRevenueCatOfferings();
  const currentOffering = getCurrentRevenueCatOffering(offerings);

  return {
    offerings,
    currentOffering,
    packages: currentOffering?.availablePackages ?? [],
  };
}

async function maybeSyncCustomerInfo(customerInfo: CustomerInfo, transactionId: string | undefined) {
  try {
    const entitlementId = getRevenueCatEntitlementId();
    const entitlement =
      customerInfo.entitlements.active[entitlementId] ||
      customerInfo.entitlements.all[entitlementId];

    if (!entitlement) {
      return;
    }

    await syncRevenueCatSubscription({
      entitlementId: entitlement.identifier,
      productId: entitlement.productIdentifier,
      store: entitlement.store,
      originalTransactionId: transactionId,
      isActive: entitlement.isActive,
      expiresDate: entitlement.expirationDate ?? undefined,
      purchaseDate: entitlement.latestPurchaseDate ?? undefined,
      managementUrl: customerInfo.managementURL ?? undefined,
    });
  } catch (error) {
    console.warn('Failed to sync RevenueCat subscription to backend:', error);
  }
}
