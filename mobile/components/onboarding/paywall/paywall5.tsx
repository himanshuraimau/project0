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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { useSession } from '@/lib/auth';
import * as WebBrowser from 'expo-web-browser';
import { Check } from 'lucide-react-native';
import { createSubscription } from '@/lib/api/subscription';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';
import { markOnboardingCompleted } from '@/lib/storage/onboardingStorage';
import BackButton from '../../ui/BackButton';

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
    const { isSubscribed } = useSubscription();
    const appScheme = (process.env.EXPO_PUBLIC_APP_SCHEME || 'flinote').toLowerCase();

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
            const redirectUrl = ExpoLinking.createURL('/payment-status', { scheme: appScheme });

            // Create subscription checkout session
            const response = await createSubscription({
                billingInterval,
                successUrl: redirectUrl,
                cancelUrl: redirectUrl,
            });

            console.log('✅ Checkout session created:', response);

            // Open checkout URL in WebBrowser
            const result = await WebBrowser.openBrowserAsync(response.checkoutUrl, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                toolbarColor: '#6366f1',
                controlsColor: 'white',
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <BackButton style={styles.backButton} />
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
                                        <Check size={16} color="#fff" strokeWidth={3} />
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
                            <Check size={16} color="#10b981" strokeWidth={2.5} />
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
                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.subscribeButton}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                        )}
                    </LinearGradient>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
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
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    plansContainer: {
        marginBottom: 20,
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#e5e7eb',
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
        borderColor: '#6366f1',
        borderWidth: 3,
    },
    recommendedBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    recommendedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
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
        fontWeight: 'bold',
        color: '#111827',
    },
    savingsBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    savingsText: {
        color: '#d97706',
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
        fontWeight: 'bold',
        color: '#6366f1',
    },
    period: {
        fontSize: 14,
        color: '#6b7280',
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
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    unselectedCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#d1d5db',
    },
    featuresContainer: {
        backgroundColor: '#fff',
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
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 8,
    },
    subscribeButtonContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#6366f1',
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
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscribeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '600',
    },
    terms: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
    },
    termsLink: {
        textDecorationLine: 'underline',
        color: '#6366f1',
        fontWeight: '500',
    },
});
