import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { getCurrentRevenueCatOffering } from './mapper';
import { getRevenueCatOfferings } from './sdk';

export function isRevenueCatPurchaseCancelled(error: unknown): boolean {
  return Boolean((error as { userCancelled?: boolean } | null)?.userCancelled);
}

export async function purchaseRevenueCatPackage(
  packageToPurchase: PurchasesPackage
): Promise<CustomerInfo> {
  const result = await Purchases.purchasePackage(packageToPurchase);
  return result.customerInfo;
}

export async function restoreRevenueCatPurchases(): Promise<CustomerInfo> {
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
