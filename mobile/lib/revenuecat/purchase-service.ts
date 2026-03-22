import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { getCurrentRevenueCatOffering } from './mapper';
import {
  getRevenueCatOfferings,
  getRevenueCatUnsupportedReason,
  isRevenueCatNativeSupported,
} from './sdk';

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
  const result = await Purchases.purchasePackage(packageToPurchase);
  return result.customerInfo;
}

export async function restoreRevenueCatPurchases(): Promise<CustomerInfo> {
  assertPurchasesAvailable();
  return Purchases.restorePurchases();
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
