import { getRevenueCatApiBaseUrl, getRevenueCatSecretApiKey } from './config';
import type { RevenueCatSubscriberResponse } from './types';

export async function getRevenueCatSubscriber(
  appUserId: string
): Promise<RevenueCatSubscriberResponse | null> {
  const response = await fetch(
    `${getRevenueCatApiBaseUrl()}/subscribers/${encodeURIComponent(appUserId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getRevenueCatSecretApiKey()}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`RevenueCat subscriber lookup failed: HTTP ${response.status} ${errorBody}`);
  }

  return (await response.json()) as RevenueCatSubscriberResponse;
}
