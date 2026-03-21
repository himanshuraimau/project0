import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
} from 'react-native-purchases';
import { getRevenueCatApiKey } from './config';

let configuredAppUserId: string | null = null;

export function isRevenueCatConfigured(): boolean {
  return configuredAppUserId !== null;
}

export function getConfiguredRevenueCatUserId(): string | null {
  return configuredAppUserId;
}

export async function ensureRevenueCatConfigured(appUserId: string): Promise<void> {
  const apiKey = getRevenueCatApiKey();

  if (!apiKey) {
    throw new Error('RevenueCat API key is missing');
  }

  await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);

  if (!configuredAppUserId) {
    Purchases.configure({
      apiKey,
      appUserID: appUserId,
    });
    configuredAppUserId = appUserId;
    return;
  }

  if (configuredAppUserId !== appUserId) {
    await Purchases.logIn(appUserId);
    configuredAppUserId = appUserId;
  }
}

export async function getRevenueCatCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function getRevenueCatOfferings(): Promise<PurchasesOfferings> {
  return Purchases.getOfferings();
}
