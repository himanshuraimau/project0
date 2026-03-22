import Purchases from 'react-native-purchases';

export interface RevenueCatIdentityUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

export async function syncRevenueCatSubscriberAttributes(
  user: RevenueCatIdentityUser
): Promise<void> {
  await Purchases.setEmail(user.email || null);
  await Purchases.setDisplayName(user.name || null);
  await Purchases.setAttributes({
    backend_user_id: user.id,
  });
}
