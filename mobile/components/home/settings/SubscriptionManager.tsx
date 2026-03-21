import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import BackButton from '@/components/ui/BackButton'
import { getSubscriptionPlanDetails } from '@/lib/subscription/plan'
import { useTheme } from '@/lib/hooks/useTheme'
import { BlurView } from 'expo-blur'
import { restoreRevenueCatPurchases } from '@/lib/revenuecat'

export default function SubscriptionManager() {
  const router = useRouter()
  const {
    subscription,
    hasAccess,
    isActive,
    isTrial,
    daysRemaining,
    isLoading
  } = useSubscription()

  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const managementUrl =
    typeof subscription?.metadata === 'object' && subscription?.metadata
      ? (subscription.metadata as Record<string, unknown>).managementURL
      : null

  // Redirect to paywall if user doesn't have a subscription
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      router.replace('/(onboarding)/paywall/paywall5' as any)
    }
  }, [isLoading, hasAccess, router])

  const handleRestorePurchases = async () => {
    try {
      await restoreRevenueCatPurchases()
      Alert.alert('Restored', 'Purchases restored. Your subscription status will refresh automatically.')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to restore purchases.')
    }
  }

  const handleOpenManagement = async () => {
    if (typeof managementUrl !== 'string' || !managementUrl) {
      Alert.alert('Manage subscription', 'Subscription management is not available for this purchase yet.')
      return
    }

    await Linking.openURL(managementUrl)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 20,
      marginTop: 30,
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '500',
      color: c.foreground,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: c.mutedForeground,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 24,
    },
    statusText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.success,
      marginLeft: 10,
    },
    // Plan Card — glass styling
    planCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 28,
      marginBottom: 20,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    planIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: c.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    planHeaderText: {
      flex: 1,
    },
    planName: {
      fontSize: 22,
      fontWeight: '500',
      color: c.foreground,
      marginBottom: 4,
    },
    planSubtitle: {
      fontSize: 14,
      color: c.mutedForeground,
      fontWeight: '500',
    },
    planPriceSection: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 24,
    },
    planPrice: {
      fontSize: 36,
      fontWeight: '500',
      color: c.primary,
      letterSpacing: -1,
    },
    planInterval: {
      fontSize: 18,
      color: c.mutedForeground,
      fontWeight: '500',
      marginLeft: 4,
    },
    planDivider: {
      height: 1,
      backgroundColor: c.border,
      marginBottom: 20,
    },
    planInfoGrid: {
      gap: 16,
    },
    planInfoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    planInfoLabel: {
      fontSize: 14,
      color: c.mutedForeground,
      fontWeight: '500',
    },
    planInfoValue: {
      fontSize: 15,
      fontWeight: '600',
      color: c.foreground,
    },
    planInfoValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    daysRemainingText: {
      color: c.primary,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 20,
      shadowColor: c.foreground,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: c.foreground,
      marginBottom: 8,
    },
    cardSubtitle: {
      fontSize: 14,
      color: c.mutedForeground,
      marginBottom: 20,
      lineHeight: 20,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.muted,
    },
    detailLabel: {
      fontSize: 15,
      color: c.mutedForeground,
    },
    detailValue: {
      fontSize: 15,
      fontWeight: '600',
      color: c.foreground,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : '#FEF3C7',
      padding: 18,
      borderRadius: 12,
      marginBottom: 20,
    },
    warningText: {
      flex: 1,
      marginLeft: 14,
      fontSize: 14,
      color: isDark ? '#FCD34D' : '#92400E',
      lineHeight: 20,
    },
    featureCategory: {
      marginBottom: 24,
    },
    featureCategoryTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: c.foreground,
      marginBottom: 12,
    },
    // Glass feature row
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 4,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    },
    featureText: {
      marginLeft: 14,
      fontSize: 15,
      color: c.foreground,
    },
    heroSection: {
      alignItems: 'center',
      paddingVertical: 40,
      marginBottom: 12,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '500',
      color: c.foreground,
      marginBottom: 10,
    },
    heroSubtitle: {
      fontSize: 15,
      color: c.mutedForeground,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    planOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.muted,
      padding: 18,
      borderRadius: 12,
      marginBottom: 14,
      borderWidth: 2,
      borderColor: c.border,
    },
    planOptionPopular: {
      borderColor: c.primary,
      backgroundColor: c.secondary,
    },
    popularBadge: {
      position: 'absolute',
      top: -8,
      right: 16,
      backgroundColor: c.primary,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 8,
    },
    popularText: {
      color: c.background,
      fontSize: 10,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    planInfo: {
      flex: 1,
    },
    planDesc: {
      fontSize: 13,
      color: c.mutedForeground,
    },
    planPriceContainer: {
      alignItems: 'flex-end',
    },
    planPeriod: {
      fontSize: 13,
      color: c.mutedForeground,
      fontWeight: '400',
    },
    savingsBadge: {
      backgroundColor: c.success,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 6,
    },
    savingsText: {
      color: c.background,
      fontSize: 11,
      fontWeight: '600',
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '500',
      color: c.foreground,
      marginTop: 24,
      marginBottom: 12,
    },
    emptyStateText: {
      fontSize: 15,
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 22,
    },
    actionButton: {
      marginTop: 12,
      borderRadius: 12,
      backgroundColor: c.primary,
      paddingHorizontal: 18,
      paddingVertical: 14,
      alignItems: 'center',
    },
    secondaryButton: {
      marginTop: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 18,
      paddingVertical: 14,
      alignItems: 'center',
    },
    actionButtonText: {
      color: c.primaryForeground,
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: c.foreground,
      fontSize: 15,
      fontWeight: '600',
    },
  })

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // If user has an active subscription, show details
  if (hasAccess && subscription) {
    const planDetails = getSubscriptionPlanDetails(subscription)

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton iconColor={c.foreground} />
            <Text style={styles.headerTitle}>Subscription</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <Feather name="check-circle" size={20} color={c.success} />
              <Text style={styles.statusText}>
                {isTrial ? 'Trial Active' : 'Premium Active'}
              </Text>
            </View>

            {/* Current Plan Card */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planIconContainer}>
                  <Feather name="zap" size={24} color={c.primary} />
                </View>
                <View style={styles.planHeaderText}>
                  <Text style={styles.planName}>{planDetails.name} Plan</Text>
                  <Text style={styles.planSubtitle}>
                    {isTrial ? 'Trial Period' : 'Full Access'}
                  </Text>
                </View>
              </View>

              <View style={styles.planPriceSection}>
                <Text style={styles.planPrice}>{planDetails.price}</Text>
                <Text style={styles.planInterval}>/{planDetails.interval}</Text>
              </View>

              <View style={styles.planDivider} />

              <View style={styles.planInfoGrid}>
                <View style={styles.planInfoItem}>
                  <Text style={styles.planInfoLabel}>Status</Text>
                  <View style={styles.planInfoValueContainer}>
                    <View style={[styles.statusDot, { backgroundColor: isActive ? c.success : c.warning }]} />
                    <Text style={styles.planInfoValue}>
                      {isActive && !isTrial ? 'Active' : isTrial ? 'Trial' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {(isActive || isTrial) && (subscription.nextBillingDate || subscription.currentPeriodEnd) && (
                  <View style={styles.planInfoItem}>
                    <Text style={styles.planInfoLabel}>
                      {isTrial ? 'Trial Ends' : 'Next Billing'}
                    </Text>
                    <Text style={styles.planInfoValue}>
                      {new Date((subscription.nextBillingDate || subscription.currentPeriodEnd)!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                )}

                {daysRemaining !== null && (
                  <View style={styles.planInfoItem}>
                    <Text style={styles.planInfoLabel}>Days Remaining</Text>
                    <Text style={[styles.planInfoValue, styles.daysRemainingText]}>
                      {daysRemaining} days
                    </Text>
                  </View>
                )}

                <View style={styles.planInfoItem}>
                  <Text style={styles.planInfoLabel}>Billing Interval</Text>
                  <Text style={styles.planInfoValue}>
                    {planDetails.interval === 'year' ? 'Yearly' : 'Monthly'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cancel Warning */}
            {subscription.cancelAtPeriodEnd && (
              <View style={styles.warningCard}>
                <Feather name="alert-circle" size={18} color={c.warning} />
                <Text style={styles.warningText}>
                  Subscription will be cancelled at the end of the current period
                </Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Manage Subscription</Text>
              <Text style={styles.cardSubtitle}>
                Restore your purchases or open the store management page for this subscription.
              </Text>
              {typeof managementUrl === 'string' && managementUrl ? (
                <TouchableOpacity style={styles.actionButton} onPress={handleOpenManagement}>
                  <Text style={styles.actionButtonText}>Open Subscription Management</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRestorePurchases}>
                <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>

            {/* What's Included Section */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What&apos;s Included</Text>
              <Text style={styles.cardSubtitle}>
                Everything you need to supercharge your learning
              </Text>

              {/* Core Features */}
              <View style={styles.featureCategory}>
                <Text style={styles.featureCategoryTitle}>Content Processing</Text>
                {[
                  'Unlimited Audio Recording',
                  'Upload Audio & PDF Files',
                  'Process YouTube Videos',
                  'Web Page Processing',
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check" size={16} color={c.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* AI Features */}
              <View style={styles.featureCategory}>
                <Text style={styles.featureCategoryTitle}>AI-Powered Tools</Text>
                {[
                  'AI-Powered Note Generation',
                  'Smart Flashcards',
                  'Interactive Quizzes',
                  'AI Chatbot Assistant',
                  'Mind Maps & Visualizations',
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check" size={16} color={c.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Additional Features */}
              <View style={styles.featureCategory}>
                <Text style={styles.featureCategoryTitle}>Premium Benefits</Text>
                {[
                  'Multi-Language Support',
                  'Cloud Sync & Backup',
                  'Unlimited Storage',
                  'Priority Support',
                  'Export & Share Notes',
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check" size={16} color={c.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    )
  }

  // If user doesn't have a subscription, they'll be redirected by useEffect
  // Show loading state while redirecting
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={styles.loadingText}>Redirecting...</Text>
        </View>
      </SafeAreaView>
    </View>
  )
}
