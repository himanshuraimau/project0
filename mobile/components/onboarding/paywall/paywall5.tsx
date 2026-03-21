import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSession } from '@/lib/auth';
import { Check } from 'lucide-react-native';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';
import { markOnboardingCompleted } from '@/lib/storage/onboardingStorage';
import BackButton from '../../ui/BackButton';
import { useTheme } from '@/lib/hooks/useTheme';
import {
  isRevenueCatPurchaseCancelled,
  mapOfferingToRevenueCatPlans,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  useRevenueCat,
} from '@/lib/revenuecat';

const FEATURES = [
  'Unlimited access',
  'Premium features',
  'Priority support',
  'No ads',
];

export default function PaywallScreen() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const { isSubscribed, refreshSubscription } = useSubscription();
  const { currentOffering, isLoading: revenueCatLoading, error: revenueCatError } = useRevenueCat();

  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';

  const plans = useMemo(() => mapOfferingToRevenueCatPlans(currentOffering), [currentOffering]);
  const [selectedPlan, setSelectedPlan] = useState('plan_yearly');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleSubscribedUser = async () => {
      if (isSubscribed) {
        console.log('✅ User already subscribed, redirecting to home');
        try {
          await markOnboardingCompleted();
        } catch (error) {
          console.error('Failed to mark onboarding complete:', error);
        }
        router.replace('/(home)');
      }
    };

    handleSubscribedUser();
  }, [isSubscribed, router]);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);

      if (!user?.email) {
        Alert.alert('Error', 'User information not found. Please log in again.', [{ text: 'OK' }]);
        return;
      }

      const selectedRevenueCatPlan = plans.find((plan) => plan.id === selectedPlan);
      if (!selectedRevenueCatPlan?.package) {
        throw new Error(
          revenueCatError ||
            'Subscriptions are not available right now. Check your RevenueCat offering setup and try again.'
        );
      }

      console.log('🛒 Starting RevenueCat purchase for:', user.email);
      await purchaseRevenueCatPackage(selectedRevenueCatPlan.package);
      await refreshSubscription();
      await markOnboardingCompleted();
      router.replace('/(home)');
    } catch (error: any) {
      if (isRevenueCatPurchaseCancelled(error)) {
        console.log('ℹ️ RevenueCat purchase cancelled by user');
        return;
      }

      console.error('❌ Subscription error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create subscription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);

      const customerInfo = await restoreRevenueCatPurchases();
      await refreshSubscription();

      const entitlementId = process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || 'pro';
      const hasAccess = Boolean(customerInfo.entitlements.active[entitlementId]);

      if (hasAccess) {
        await markOnboardingCompleted();
        Alert.alert('Restored', 'Your purchases have been restored successfully.');
        router.replace('/(home)');
        return;
      }

      Alert.alert('No purchases found', 'We could not find an active subscription to restore.');
    } catch (error: any) {
      console.error('❌ Restore purchases error:', error);
      Alert.alert('Error', error.message || 'Failed to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Premium?',
      'You can always subscribe later to unlock all premium features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await markOnboardingCompleted();
            } catch (error) {
              console.error('Failed to mark onboarding complete:', error);
            }
            router.replace('/(home)');
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingVertical: 44,
    },
    backButton: {
      position: 'absolute',
      top: 44,
      left: 20,
      zIndex: 10,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 30,
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: '500',
      color: c.foreground,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 22,
    },
    errorText: {
      marginTop: 10,
      color: c.destructive,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 18,
    },
    plansContainer: {
      marginBottom: 20,
    },
    planCard: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
      position: 'relative',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    planCardSelected: {
      borderColor: c.primary,
      borderWidth: 2,
      backgroundColor: isDark ? 'rgba(130,100,255,0.08)' : c.card,
    },
    recommendedBadge: {
      position: 'absolute',
      top: -10,
      right: 20,
      backgroundColor: c.success,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    recommendedText: {
      color: c.background,
      fontSize: 10,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    planName: {
      fontSize: 18,
      fontWeight: '500',
      color: c.foreground,
    },
    savingsBadge: {
      backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : '#fef3c7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 8,
    },
    savingsText: {
      color: c.warning,
      fontSize: 11,
      fontWeight: '600',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    price: {
      fontSize: 24,
      fontWeight: '500',
      color: c.primary,
    },
    period: {
      fontSize: 14,
      color: c.mutedForeground,
      marginLeft: 4,
    },
    selectionIndicator: {
      position: 'absolute',
      top: 12,
      right: 12,
    },
    selectedCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unselectedCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.border,
    },
    featuresContainer: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    featuresTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: c.foreground,
      marginBottom: 10,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      borderRadius: 10,
      padding: 12,
    },
    featureText: {
      fontSize: 14,
      color: c.foreground,
      marginLeft: 8,
    },
    subscribeButtonContainer: {
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    subscribeButton: {
      backgroundColor: c.primary,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    subscribeButtonDisabled: {
      opacity: 0.6,
    },
    subscribeButtonText: {
      color: c.primaryForeground,
      fontSize: 18,
      fontWeight: '500',
    },
    restoreButton: {
      paddingVertical: 14,
      alignItems: 'center',
    },
    restoreButtonText: {
      color: c.mutedForeground,
      fontSize: 14,
      fontWeight: '600',
    },
    skipButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    skipButtonText: {
      color: c.mutedForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    terms: {
      fontSize: 12,
      color: c.mutedForeground,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 18,
    },
    termsLink: {
      textDecorationLine: 'underline',
      color: c.primary,
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <BackButton style={styles.backButton} iconColor={c.foreground} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock all premium features and take your experience to the next level
          </Text>
          {revenueCatError ? <Text style={styles.errorText}>{revenueCatError}</Text> : null}
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.7}
            >
              {plan.billingInterval === 'yearly' && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.title}</Text>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>{plan.period}</Text>
                {plan.savings ? (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.selectionIndicator}>
                {selectedPlan === plan.id ? (
                  <View style={styles.selectedCircle}>
                    <Check size={16} color={c.primaryForeground} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.unselectedCircle} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What&apos;s Included:</Text>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Check size={16} color={c.success} strokeWidth={2.5} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButtonContainer,
            (isLoading || revenueCatLoading) && styles.subscribeButtonDisabled,
          ]}
          onPress={handleSubscribe}
          disabled={isLoading || revenueCatLoading}
          activeOpacity={0.8}
        >
          <View style={styles.subscribeButton}>
            {isLoading || revenueCatLoading ? (
              <ActivityIndicator color={c.primaryForeground} size="small" />
            ) : (
              <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
            )}
          </View>
        </TouchableOpacity>

        <Pressable
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isLoading || revenueCatLoading}
        >
          <Text style={styles.restoreButtonText}>Restore purchases</Text>
        </Pressable>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By subscribing, you agree to our{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://flinote.ai/terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://flinote.ai/privacy')}>
            Privacy Policy
          </Text>
          .
          {'\n'}Subscription automatically renews unless canceled.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
