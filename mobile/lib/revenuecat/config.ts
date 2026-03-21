import { Platform } from 'react-native';
import type { RevenueCatStoreMode } from './types';

const DEFAULT_ENTITLEMENT_ID = 'pro';
const DEFAULT_OFFERING_ID = 'default';

export function getRevenueCatStoreMode(): RevenueCatStoreMode {
  const rawMode = process.env.EXPO_PUBLIC_RC_STORE_MODE?.trim().toLowerCase();
  if (rawMode === 'live') {
    return 'live';
  }
  if (rawMode === 'test') {
    return 'test';
  }
  return __DEV__ ? 'test' : 'live';
}

export function getRevenueCatEntitlementId(): string {
  return process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID?.trim() || DEFAULT_ENTITLEMENT_ID;
}

export function getRevenueCatDefaultOfferingId(): string {
  return process.env.EXPO_PUBLIC_RC_DEFAULT_OFFERING_ID?.trim() || DEFAULT_OFFERING_ID;
}

export function getRevenueCatApiKey(): string {
  const mode = getRevenueCatStoreMode();
  if (mode === 'test') {
    return process.env.EXPO_PUBLIC_RC_TEST_API_KEY?.trim() || '';
  }

  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_RC_IOS_API_KEY?.trim() || '';
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY?.trim() || '';
  }

  return '';
}
