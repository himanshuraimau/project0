import Constants from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
} from 'react-native-purchases';
import { getRevenueCatApiKey, getRevenueCatStoreMode } from './config';

let configuredAppUserId: string | null = null;

/** Expo Go does not ship react-native-purchases; use a dev build (expo run:ios / EAS development). */
export function getRevenueCatUnsupportedReason(): string | null {
  if (Constants.appOwnership === 'expo') {
    return 'Expo Go does not support in-app purchases. Use a development build: npx expo run:ios or npx expo run:android, or eas build --profile development. See mobile/SETUP.md.';
  }
  return null;
}

export function isRevenueCatNativeSupported(): boolean {
  return getRevenueCatUnsupportedReason() === null;
}

export function isRevenueCatConfigured(): boolean {
  return configuredAppUserId !== null;
}

export function getConfiguredRevenueCatUserId(): string | null {
  return configuredAppUserId;
}

export async function ensureRevenueCatConfigured(appUserId: string): Promise<void> {
  const unsupported = getRevenueCatUnsupportedReason();
  if (unsupported) {
    throw new Error(unsupported);
  }

  const apiKey = getRevenueCatApiKey();

  if (!apiKey) {
    const mode = getRevenueCatStoreMode();
    const hint =
      mode === 'test'
        ? 'Set EXPO_PUBLIC_RC_TEST_API_KEY (RevenueCat Test Store public SDK key). For EAS builds, add it under env or eas secret.'
        : 'Set EXPO_PUBLIC_RC_IOS_API_KEY / EXPO_PUBLIC_RC_ANDROID_API_KEY, or set EXPO_PUBLIC_RC_STORE_MODE=test with a test key.';
    throw new Error(`RevenueCat API key is missing. ${hint}`);
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
