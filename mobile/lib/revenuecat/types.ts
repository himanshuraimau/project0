import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

export type RevenueCatStoreMode = 'test' | 'live';
export type RevenueCatBillingInterval = 'monthly' | 'yearly';

export interface RevenueCatPlan {
  id: string;
  billingInterval: RevenueCatBillingInterval;
  package: PurchasesPackage | null;
  title: string;
  price: string;
  period: string;
  savings: string | null;
}

export interface RevenueCatSubscriptionSnapshot {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOffering | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
}
