import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '@/components/ui/BackButton'
import { getSubscriptionPlanDetails, isYearlySubscription } from '@/lib/subscription/plan'
import { useTheme } from '@/lib/hooks/useTheme'
import { restoreRevenueCatPurchases } from '@/lib/revenuecat'
import {
  cancelSubscriptionWithOptions,
  getSubscriptionPortal,
  getSubscriptionStatus,
  reactivateSubscription,
  upgradeSubscriptionToYearly,
} from '@/lib/api/subscription'
import type { SubscriptionStatusResponse } from '@/lib/api/types'

export default function SubscriptionManager() {
  const router = useRouter()
  const {
    subscription,
    hasAccess,
    isActive,
    isTrial,
    daysRemaining,
    isLoading,
    refreshSubscription,
  } = useSubscription()
  const [backendStatus, setBackendStatus] = useState<SubscriptionStatusResponse | null>(null)
  const [isSyncingBackend, setIsSyncingBackend] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isReactivating, setIsReactivating] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const hasBackendSubscription = backendStatus?.hasSubscription === true && Boolean(backendStatus.subscription)
  const backendSubscription = hasBackendSubscription ? backendStatus?.subscription ?? null : null
  const clientSubscription = subscription
  const backendMetadata =
    typeof backendSubscription?.metadata === 'object' && backendSubscription?.metadata
      ? (backendSubscription.metadata as Record<string, unknown>)
      : {}
  const clientMetadata =
    typeof clientSubscription?.metadata === 'object' && clientSubscription?.metadata
      ? (clientSubscription.metadata as Record<string, unknown>)
      : {}
  const mergedMetadata = {
    ...clientMetadata,
    ...backendMetadata,
  }
  const effectiveSubscription = backendSubscription ?? clientSubscription
  const effectiveHasAccess = hasBackendSubscription ? backendStatus?.access?.hasAccess ?? false : hasAccess
  const effectiveIsActive = hasBackendSubscription ? backendStatus?.access?.isActive ?? false : isActive
  const effectiveIsTrial = hasBackendSubscription ? backendStatus?.access?.isTrial ?? false : isTrial
  const effectiveDaysRemaining = hasBackendSubscription
    ? backendStatus?.access?.daysRemaining ?? null
    : daysRemaining
  const managementUrl =
    effectiveSubscription?.managementUrl ||
    (typeof mergedMetadata.managementURL === 'string' ? mergedMetadata.managementURL : null)
  const billingProvider =
    effectiveSubscription?.billingProvider && effectiveSubscription.billingProvider !== 'UNKNOWN'
      ? effectiveSubscription.billingProvider
      : clientSubscription?.billingProvider ||
        (typeof mergedMetadata.provider === 'string' ? mergedMetadata.provider : null)
  const isPaddleManaged =
    billingProvider === 'PADDLE' || Boolean(effectiveSubscription?.paddleSubscriptionId)
  const isYearlyPlan = isYearlySubscription(effectiveSubscription)
  const canOpenManagement = Boolean(isPaddleManaged || (typeof managementUrl === 'string' && managementUrl))
  const managementUnavailableMessage =
    billingProvider === 'TEST_STORE'
      ? 'RevenueCat Test Store purchases do not have a subscription management page. This purchase is only for development testing.'
      : 'Subscription management is not available for this purchase yet.'

  const refreshManagementState = useCallback(
    async (silent: boolean = false) => {
      try {
        if (!silent) {
          setIsSyncingBackend(true)
        }

        const data = await getSubscriptionStatus()
        setBackendStatus(data)
        return data
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.message?.includes('not found')) {
          setBackendStatus(null)
          return null
        }

        console.error('Failed to sync subscription management state:', error)
        return null
      } finally {
        if (!silent) {
          setIsSyncingBackend(false)
        }
      }
    },
    []
  )

  // Load provider-aware subscription state from the backend so mobile can expose
  // the same Paddle management actions as the web settings screen.
  useEffect(() => {
    if (!isLoading) {
      void refreshManagementState(false)
    }
  }, [isLoading, refreshManagementState])

  // Redirect to paywall only when we know there is no active access and no
  // subscription history to manage.
  useEffect(() => {
    if (!isLoading && !isSyncingBackend && !effectiveHasAccess && !effectiveSubscription) {
      router.replace('/(onboarding)/paywall/paywall5' as any)
    }
  }, [isLoading, isSyncingBackend, effectiveHasAccess, effectiveSubscription, router])

  const syncAllSubscriptionState = useCallback(async () => {
    await Promise.all([
      refreshSubscription(),
      refreshManagementState(true),
    ])
  }, [refreshSubscription, refreshManagementState])

  const handleRestorePurchases = async () => {
    try {
      setIsRestoring(true)
      await restoreRevenueCatPurchases()
      await syncAllSubscriptionState()

      if (effectiveHasAccess) {
        Alert.alert(
          'Already active',
          'Your subscription is already active on this account. Restore re-synced it successfully.'
        )
        return
      }

      Alert.alert('Restored', 'Purchases restored. Your subscription status will refresh automatically.')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to restore purchases.')
    } finally {
      setIsRestoring(false)
    }
  }

  const handleOpenManagement = async () => {
    try {
      if (!canOpenManagement) {
        Alert.alert('Manage subscription', managementUnavailableMessage)
        return
      }

      setIsOpeningPortal(true)

      if (isPaddleManaged) {
        const portal = await getSubscriptionPortal()
        if (portal.portalUrl) {
          await Linking.openURL(portal.portalUrl)
          return
        }
      }

      if (typeof managementUrl === 'string' && managementUrl) {
        await Linking.openURL(managementUrl)
        return
      }

      Alert.alert('Manage subscription', managementUnavailableMessage)
    } catch (error: any) {
      if (typeof managementUrl === 'string' && managementUrl) {
        await Linking.openURL(managementUrl)
        return
      }

      Alert.alert(
        'Manage subscription',
        error.message || managementUnavailableMessage || 'Failed to open subscription management.'
      )
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel subscription?',
      'Your subscription will remain active until the end of the current billing period.',
      [
        { text: 'Keep subscription', style: 'cancel' },
        {
          text: 'Cancel at period end',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true)
              const result = await cancelSubscriptionWithOptions(true)
              await syncAllSubscriptionState()
              Alert.alert('Subscription updated', result.message)
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel subscription.')
            } finally {
              setIsCancelling(false)
            }
          },
        },
      ]
    )
  }

  const handleReactivateSubscription = async () => {
    try {
      setIsReactivating(true)
      const result = await reactivateSubscription()
      await syncAllSubscriptionState()
      Alert.alert('Subscription reactivated', result.message)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reactivate subscription.')
    } finally {
      setIsReactivating(false)
    }
  }

  const handleUpgradeToYearly = async () => {
    try {
      setIsUpgrading(true)
      const result = await upgradeSubscriptionToYearly()
      await syncAllSubscriptionState()
      Alert.alert('Plan updated', result.message)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upgrade subscription.')
    } finally {
      setIsUpgrading(false)
    }
  }

  const providerLabel = useMemo(() => {
    switch (billingProvider) {
      case 'PADDLE':
        return 'Paddle'
      case 'APP_STORE':
        return 'App Store'
      case 'PLAY_STORE':
        return 'Google Play'
      case 'TEST_STORE':
        return 'RevenueCat Test Store'
      default:
        return 'External billing'
    }
  }, [billingProvider])

  const canCancel = Boolean(
    effectiveSubscription &&
      isPaddleManaged &&
      effectiveIsActive &&
      !effectiveSubscription.cancelAtPeriodEnd &&
      effectiveSubscription.status !== 'CANCELLED'
  )
  const canReactivate = Boolean(
    effectiveSubscription &&
      isPaddleManaged &&
      effectiveIsActive &&
      effectiveSubscription.cancelAtPeriodEnd
  )
  const canUpgradeToYearly = Boolean(
    effectiveSubscription &&
      isPaddleManaged &&
      effectiveIsActive &&
      !effectiveSubscription.cancelAtPeriodEnd &&
      !isYearlyPlan
  )
  const shouldShowRestore = !isPaddleManaged
  const showManagementButton = canOpenManagement
  const managementButtonLabel = isPaddleManaged ? 'Open Billing Portal' : 'Open Subscription Management'

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
    buttonSpinnerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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

  if (isLoading || (isSyncingBackend && !effectiveSubscription && !effectiveHasAccess)) {
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
  if (effectiveSubscription) {
    const planDetails = getSubscriptionPlanDetails(effectiveSubscription)
    const statusLabel = effectiveHasAccess
      ? effectiveIsTrial
        ? 'Trial Active'
        : effectiveSubscription.cancelAtPeriodEnd
          ? 'Cancelling'
          : 'Premium Active'
      : effectiveSubscription.cancelAtPeriodEnd
        ? 'Ending Soon'
        : effectiveSubscription.displayStatus || 'Subscription History'

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
              <Feather
                name={effectiveHasAccess ? 'check-circle' : 'clock'}
                size={20}
                color={effectiveHasAccess ? c.success : c.warning}
              />
              <Text style={[styles.statusText, !effectiveHasAccess ? { color: c.warning } : null]}>
                {statusLabel}
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
                    {effectiveIsTrial ? 'Trial Period' : 'Full Access'}
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
                    <View style={[styles.statusDot, { backgroundColor: effectiveIsActive ? c.success : c.warning }]} />
                    <Text style={styles.planInfoValue}>
                      {effectiveIsActive && !effectiveIsTrial ? 'Active' : effectiveIsTrial ? 'Trial' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {(effectiveIsActive || effectiveIsTrial) && (effectiveSubscription.nextBillingDate || effectiveSubscription.currentPeriodEnd) && (
                  <View style={styles.planInfoItem}>
                    <Text style={styles.planInfoLabel}>
                      {effectiveIsTrial ? 'Trial Ends' : 'Next Billing'}
                    </Text>
                    <Text style={styles.planInfoValue}>
                      {new Date((effectiveSubscription.nextBillingDate || effectiveSubscription.currentPeriodEnd)!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                )}

                {effectiveDaysRemaining !== null && (
                  <View style={styles.planInfoItem}>
                    <Text style={styles.planInfoLabel}>Days Remaining</Text>
                    <Text style={[styles.planInfoValue, styles.daysRemainingText]}>
                      {effectiveDaysRemaining} days
                    </Text>
                  </View>
                )}

                <View style={styles.planInfoItem}>
                  <Text style={styles.planInfoLabel}>Billing Interval</Text>
                  <Text style={styles.planInfoValue}>
                    {planDetails.interval === 'year' ? 'Yearly' : 'Monthly'}
                  </Text>
                </View>

                <View style={styles.planInfoItem}>
                  <Text style={styles.planInfoLabel}>Provider</Text>
                  <Text style={styles.planInfoValue}>{providerLabel}</Text>
                </View>
              </View>
            </View>

            {/* Cancel Warning */}
            {effectiveSubscription.cancelAtPeriodEnd && (
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
                {isPaddleManaged
                  ? 'Open the Paddle billing portal, cancel at period end, or upgrade your current plan.'
                  : canOpenManagement
                    ? 'Open your store management page or restore purchases for this subscription.'
                    : 'Restore purchases to re-sync this subscription on this device.'}
              </Text>

              {showManagementButton ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleOpenManagement}
                  disabled={isOpeningPortal}
                >
                  {isOpeningPortal ? (
                    <View style={styles.buttonSpinnerRow}>
                      <ActivityIndicator size="small" color={c.primaryForeground} />
                      <Text style={styles.actionButtonText}>Opening…</Text>
                    </View>
                  ) : (
                    <Text style={styles.actionButtonText}>{managementButtonLabel}</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cardSubtitle, { marginBottom: 0 }]}>
                  {managementUnavailableMessage}
                </Text>
              )}

              {canUpgradeToYearly ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleUpgradeToYearly}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? (
                    <View style={styles.buttonSpinnerRow}>
                      <ActivityIndicator size="small" color={c.foreground} />
                      <Text style={styles.secondaryButtonText}>Upgrading…</Text>
                    </View>
                  ) : (
                    <Text style={styles.secondaryButtonText}>Upgrade to Yearly</Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {canCancel ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleCancelSubscription}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <View style={styles.buttonSpinnerRow}>
                      <ActivityIndicator size="small" color={c.foreground} />
                      <Text style={styles.secondaryButtonText}>Cancelling…</Text>
                    </View>
                  ) : (
                    <Text style={styles.secondaryButtonText}>Cancel Subscription</Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {canReactivate ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleReactivateSubscription}
                  disabled={isReactivating}
                >
                  {isReactivating ? (
                    <View style={styles.buttonSpinnerRow}>
                      <ActivityIndicator size="small" color={c.foreground} />
                      <Text style={styles.secondaryButtonText}>Reactivating…</Text>
                    </View>
                  ) : (
                    <Text style={styles.secondaryButtonText}>Reactivate Subscription</Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {shouldShowRestore ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleRestorePurchases}
                  disabled={isRestoring}
                >
                  {isRestoring ? (
                    <View style={styles.buttonSpinnerRow}>
                      <ActivityIndicator size="small" color={c.foreground} />
                      <Text style={styles.secondaryButtonText}>Restoring…</Text>
                    </View>
                  ) : (
                    <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {isSyncingBackend ? (
                <Text style={[styles.cardSubtitle, { marginBottom: 0, marginTop: 14 }]}>
                  Syncing billing details…
                </Text>
              ) : null}
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
