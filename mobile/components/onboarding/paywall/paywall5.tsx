import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSession } from '@/lib/auth';
import * as WebBrowser from 'expo-web-browser';
import { Check } from 'lucide-react-native';
import { createSubscription } from '@/lib/api/subscription';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';
import { markOnboardingCompleted } from '@/lib/storage/onboardingStorage';
import BackButton from '../../ui/BackButton';
import { useTheme } from '@/lib/hooks/useTheme';
import { BlurView } from 'expo-blur';

/**
 * PaywallScreen Component
 * Displays subscription plans and handles payment flow via Paddle Checkout
 */

// Subscription plan configuration
const PLANS = [
    {
        id: 'plan_monthly',
        name: 'Monthly',
        price: '$19.99',
        period: '/month',
        recommended: false,
        savings: null,
        billingInterval: 'monthly' as const,
    },
    {
        id: 'plan_yearly',
        name: 'Yearly',
        price: '$16.67',
        period: '/month',
        recommended: true,
        savings: 'Save 17%',
        billingInterval: 'yearly' as const,
    },
];

// Plan features
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
    const appScheme = (process.env.EXPO_PUBLIC_APP_SCHEME || 'flinote').toLowerCase();

    const { theme, mode } = useTheme();
    const c = theme.colors;
    const isDark = mode === 'dark';

    const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id); // Default to yearly
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Auto-redirect to home if user is already subscribed
     */
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

    /**
     * Handle deep link for payment status
     */
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const url = event.url;
            console.log('🔗 Deep link received:', url);

            // Parse the URL
            if (url.includes('payment-status')) {
                const queryString = url.includes('?') ? url.split('?')[1] : '';
                const urlParams = new URLSearchParams(queryString);
                const status = urlParams.get('status');
                const transactionId = urlParams.get('transaction_id');
                const subscriptionId = urlParams.get('subscription_id');

                console.log('💳 Payment status:', status);
                console.log('🧾 Transaction ID:', transactionId);
                console.log('🆔 Subscription ID:', subscriptionId);

                if (status === 'success') {
                    // Refresh subscription immediately and once again shortly after webhook processing
                    await refreshSubscription();
                    setTimeout(() => {
                        refreshSubscription().catch((error) => {
                            console.error('Delayed refresh failed:', error);
                        });
                    }, 2000);

                    // Mark onboarding as completed
                    try {
                        await markOnboardingCompleted();
                    } catch (error) {
                        console.error('Failed to mark onboarding complete:', error);
                    }

                    // Show success message
                    Alert.alert(
                        '🎉 Success!',
                        'Your subscription is now active. Welcome to premium!',
                        [
                            {
                                text: 'Get Started',
                                onPress: () => router.replace('/(home)'),
                            },
                        ]
                    );
                } else if (status === 'canceled' || status === 'cancelled') {
                    Alert.alert(
                        '❌ Payment Canceled',
                        'Your payment was canceled. You can try again anytime.',
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert(
                        '⚠️ Payment Failed',
                        'Something went wrong with your payment. Please try again.',
                        [{ text: 'OK' }]
                    );
                }
            }
        };

        // Listen for deep links (app already open)
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened via deep link
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        // Cleanup
        return () => {
            subscription.remove();
        };
    }, [refreshSubscription, router]);

    /**
     * Handle subscription purchase
     */
    const handleSubscribe = async () => {
        try {
            setIsLoading(true);

            // Get user info from Better Auth
            const userEmail = user?.email;

            if (!userEmail) {
                Alert.alert(
                    'Error',
                    'User information not found. Please log in again.',
                    [{ text: 'OK' }]
                );
                setIsLoading(false);
                return;
            }

            console.log('🛒 Creating subscription for:', userEmail);

            // Get the selected plan details
            const plan = PLANS.find(p => p.id === selectedPlan);
            const billingInterval = plan?.billingInterval || 'monthly';

            // Create subscription checkout session
            const response = await createSubscription({
                billingInterval,
                successUrl: `${appScheme}://payment-status`,
                cancelUrl: `${appScheme}://payment-status`,
            });

            console.log('✅ Checkout session created:', response);

            // Open checkout URL in WebBrowser
            const result = await WebBrowser.openBrowserAsync(response.checkoutUrl, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                toolbarColor: c.primary,
                controlsColor: c.primaryForeground,
            });

            console.log('📱 WebBrowser result:', result);
        } catch (error: any) {
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

    /**
     * Handle skip button
     */
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
            position: 'relative' as const,
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
            position: 'absolute' as const,
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
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
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
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
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
            position: 'absolute' as const,
            top: 12,
            right: 12,
        },
        selectedCircle: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: c.primary,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
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
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
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
            overflow: 'hidden' as const,
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
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            borderRadius: 16,
        },
        subscribeButtonText: {
            color: c.primaryForeground,
            fontSize: 18,
            fontWeight: '500',
        },
        skipButton: {
            paddingVertical: 12,
            alignItems: 'center' as const,
        },
        skipButtonText: {
            color: c.mutedForeground,
            fontSize: 16,
            fontWeight: '600',
        },
        terms: {
            fontSize: 12,
            color: c.mutedForeground,
            textAlign: 'center' as const,
            marginTop: 8,
            lineHeight: 18,
        },
        termsLink: {
            textDecorationLine: 'underline' as const,
            color: c.primary,
            fontWeight: '500',
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <BackButton style={styles.backButton} iconColor={c.foreground} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Choose Your Plan</Text>
                    <Text style={styles.subtitle}>
                        Unlock all premium features and take your experience to the next level
                    </Text>
                </View>

                {/* Plans */}
                <View style={styles.plansContainer}>
                    {PLANS.map((plan) => (
                        <TouchableOpacity
                            key={plan.id}
                            style={[
                                styles.planCard,
                                selectedPlan === plan.id && styles.planCardSelected,
                            ]}
                            onPress={() => setSelectedPlan(plan.id)}
                            activeOpacity={0.7}
                        >
                            {plan.recommended && (
                                <View style={styles.recommendedBadge}>
                                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                </View>
                            )}

                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>{plan.name}</Text>
                            </View>

                            <View style={styles.priceContainer}>
                                <Text style={styles.price}>{plan.price}</Text>
                                <Text style={styles.period}>{plan.period}</Text>
                                {plan.savings && (
                                    <View style={styles.savingsBadge}>
                                        <Text style={styles.savingsText}>{plan.savings}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Selection indicator */}
                            <View style={styles.selectionIndicator}>
                                {selectedPlan === plan.id && (
                                    <View style={styles.selectedCircle}>
                                        <Check size={16} color={c.primaryForeground} strokeWidth={3} />
                                    </View>
                                )}
                                {selectedPlan !== plan.id && <View style={styles.unselectedCircle} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                    <Text style={styles.featuresTitle}>What&apos;s Included:</Text>
                    {FEATURES.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                            <Check size={16} color={c.success} strokeWidth={2.5} />
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* Subscribe Button */}
                <TouchableOpacity
                    style={styles.subscribeButtonContainer}
                    onPress={handleSubscribe}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <View style={styles.subscribeButton}>
                        {isLoading ? (
                            <ActivityIndicator color={c.primaryForeground} size="small" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    activeOpacity={0.7}
                >
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.terms}>
                    By subscribing, you agree to our{" "}
                    <Text
                        style={styles.termsLink}
                        onPress={() => Linking.openURL('https://flinote.ai/terms')}
                    >
                        Terms of Service
                    </Text>{" "}
                    and{" "}
                    <Text
                        style={styles.termsLink}
                        onPress={() => Linking.openURL('https://flinote.ai/privacy')}
                    >
                        Privacy Policy
                    </Text>.
                    {"\n"}Subscription automatically renews unless canceled.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
