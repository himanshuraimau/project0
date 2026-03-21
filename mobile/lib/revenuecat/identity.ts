import Purchases from 'react-native-purchases';

export interface RevenueCatIdentityUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

export async function syncRevenueCatSubscriberAttributes(
  user: RevenueCatIdentityUser
): Promise<void> {
  await Promise.allSettled([
    Purchases.setEmail(user.email || null),
    Purchases.setDisplayName(user.name || null),
    Purchases.setAttributes({
      backend_user_id: user.id,
    }),
  ]);
}
