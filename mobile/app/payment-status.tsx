import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';
import { markOnboardingCompleted } from '@/lib/storage/onboardingStorage';

type PaymentResult = 'pending' | 'success' | 'canceled' | 'failed';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function PaymentStatusScreen() {
  const params = useLocalSearchParams<{
    status?: string | string[];
    transaction_id?: string | string[];
    subscription_id?: string | string[];
  }>();
  const router = useRouter();
  const { refreshSubscription } = useSubscription();
  const [result, setResult] = useState<PaymentResult>('pending');

  const status = useMemo(() => firstParam(params.status).toLowerCase(), [params.status]);
  const transactionId = useMemo(() => firstParam(params.transaction_id), [params.transaction_id]);
  const subscriptionId = useMemo(() => firstParam(params.subscription_id), [params.subscription_id]);

  useEffect(() => {
    let isCancelled = false;

    const resolvePayment = async () => {
      try {
        await WebBrowser.dismissBrowser();
      } catch (error) {
        console.log('Payment browser already dismissed:', error);
      }

      if (status === 'success') {
        try {
          await refreshSubscription({
            transactionId: transactionId || undefined,
            subscriptionId: subscriptionId || undefined,
          });

          setTimeout(() => {
            refreshSubscription({
              transactionId: transactionId || undefined,
              subscriptionId: subscriptionId || undefined,
            }).catch((error) => {
              console.error('Delayed payment sync failed:', error);
            });
          }, 2000);
        } catch (error) {
          console.error('Immediate payment sync failed:', error);
        }

        try {
          await markOnboardingCompleted();
        } catch (error) {
          console.error('Failed to mark onboarding complete after payment:', error);
        }

        if (!isCancelled) {
          setResult('success');
        }
        return;
      }

      if (!isCancelled) {
        setResult(status === 'canceled' || status === 'cancelled' ? 'canceled' : 'failed');
      }
    };

    resolvePayment();

    return () => {
      isCancelled = true;
    };
  }, [refreshSubscription, status, subscriptionId, transactionId]);

  const title =
    result === 'success'
      ? 'Payment successful'
      : result === 'canceled'
        ? 'Payment canceled'
        : result === 'failed'
          ? 'Payment incomplete'
          : 'Finalizing purchase';

  const description =
    result === 'success'
      ? 'Your subscription is active. You can continue into the app now.'
      : result === 'canceled'
        ? 'Your checkout was canceled. You can go back and try again anytime.'
        : result === 'failed'
          ? 'We could not confirm your payment. Please try the checkout again.'
          : 'We are syncing your payment status with Flinote.';

  const buttonLabel = result === 'success' ? 'Continue' : 'Back to paywall';
  const handlePress = () => {
    if (result === 'success') {
      router.replace('/(home)');
      return;
    }

    router.replace('/(onboarding)/paywall/paywall5' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {result === 'pending' ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : (
          <View style={[styles.badge, result === 'success' ? styles.badgeSuccess : styles.badgeMuted]} />
        )}

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {result !== 'pending' && (
          <Pressable onPress={handlePress} style={styles.button}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 24,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeMuted: {
    backgroundColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 180,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
