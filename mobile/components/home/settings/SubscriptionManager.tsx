import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getSubscriptionPlanDetails, isYearlySubscription } from '@/lib/subscription/plan'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
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
  const mergedMetadata = { ...clientMetadata, ...backendMetadata }
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
      ? 'RevenueCat Test Store purchases do not have a management page.'
      : 'Subscription management is not available for this purchase yet.'

  const refreshManagementState = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsSyncingBackend(true)
      const data = await getSubscriptionStatus()
      setBackendStatus(data)
      return data
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.message?.includes('not found')) {
        setBackendStatus(null)
        return null
      }
      return null
    } finally {
      if (!silent) setIsSyncingBackend(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) void refreshManagementState(false)
  }, [isLoading, refreshManagementState])

  useEffect(() => {
    if (!isLoading && !isSyncingBackend && !effectiveHasAccess && !effectiveSubscription) {
      router.replace('/(onboarding)/paywall/paywall5' as any)
    }
  }, [isLoading, isSyncingBackend, effectiveHasAccess, effectiveSubscription, router])

  const syncAll = useCallback(async () => {
    await Promise.all([refreshSubscription(), refreshManagementState(true)])
  }, [refreshSubscription, refreshManagementState])

  const handleRestorePurchases = async () => {
    try {
      setIsRestoring(true)
      await restoreRevenueCatPurchases()
      await syncAll()
      Alert.alert('Restored', 'Purchases restored successfully.')
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
        if (portal.portalUrl) { await Linking.openURL(portal.portalUrl); return }
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
      Alert.alert('Manage subscription', error.message || 'Failed to open management.')
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const handleCancel = () => {
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
              await syncAll()
              Alert.alert('Subscription updated', result.message)
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel.')
            } finally {
              setIsCancelling(false)
            }
          },
        },
      ]
    )
  }

  const handleReactivate = async () => {
    try {
      setIsReactivating(true)
      const result = await reactivateSubscription()
      await syncAll()
      Alert.alert('Reactivated', result.message)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reactivate.')
    } finally {
      setIsReactivating(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true)
      const result = await upgradeSubscriptionToYearly()
      await syncAll()
      Alert.alert('Upgraded', result.message)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upgrade.')
    } finally {
      setIsUpgrading(false)
    }
  }

  const providerLabel = useMemo(() => {
    switch (billingProvider) {
      case 'PADDLE': return 'Paddle'
      case 'APP_STORE': return 'App Store'
      case 'PLAY_STORE': return 'Google Play'
      case 'TEST_STORE': return 'Test Store'
      default: return 'External'
    }
  }, [billingProvider])

  const canCancel = Boolean(effectiveSubscription && isPaddleManaged && effectiveIsActive && !effectiveSubscription.cancelAtPeriodEnd && effectiveSubscription.status !== 'CANCELLED')
  const canReactivate = Boolean(effectiveSubscription && isPaddleManaged && effectiveIsActive && effectiveSubscription.cancelAtPeriodEnd)
  const canUpgradeToYearly = Boolean(effectiveSubscription && isPaddleManaged && effectiveIsActive && !effectiveSubscription.cancelAtPeriodEnd && !isYearlyPlan)
  const shouldShowRestore = !isPaddleManaged

  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  if (isLoading || (isSyncingBackend && !effectiveSubscription && !effectiveHasAccess)) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.loadingText, { color: c.mutedForeground }]}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  if (!effectiveSubscription) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.loadingText, { color: c.mutedForeground }]}>Redirecting...</Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  const planDetails = getSubscriptionPlanDetails(effectiveSubscription)
  const statusLabel = effectiveHasAccess
    ? effectiveIsTrial
      ? 'Trial Active'
      : effectiveSubscription.cancelAtPeriodEnd ? 'Cancelling' : 'Premium Active'
    : effectiveSubscription.cancelAtPeriodEnd ? 'Ending Soon' : (effectiveSubscription.displayStatus || 'History')
  const statusColor = effectiveHasAccess
    ? (effectiveSubscription.cancelAtPeriodEnd ? '#FF9500' : '#34C759')
    : '#FF3B30'

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  type ActionItem = {
    label: string
    icon: string
    iconBg: string
    onPress: () => void
    loading: boolean
    loadingLabel: string
    destructive?: boolean
  }

  const actions: ActionItem[] = []
  if (canOpenManagement) {
    actions.push({
      label: isPaddleManaged ? 'Billing Portal' : 'Manage Subscription',
      icon: 'open-outline',
      iconBg: '#007AFF',
      onPress: handleOpenManagement,
      loading: isOpeningPortal,
      loadingLabel: 'Opening...',
    })
  }
  if (canUpgradeToYearly) {
    actions.push({
      label: 'Upgrade to Yearly',
      icon: 'arrow-up-circle',
      iconBg: '#34C759',
      onPress: handleUpgrade,
      loading: isUpgrading,
      loadingLabel: 'Upgrading...',
    })
  }
  if (canReactivate) {
    actions.push({
      label: 'Reactivate Subscription',
      icon: 'refresh',
      iconBg: '#34C759',
      onPress: handleReactivate,
      loading: isReactivating,
      loadingLabel: 'Reactivating...',
    })
  }
  if (shouldShowRestore) {
    actions.push({
      label: 'Restore Purchases',
      icon: 'refresh-circle',
      iconBg: '#5856D6',
      onPress: handleRestorePurchases,
      loading: isRestoring,
      loadingLabel: 'Restoring...',
    })
  }
  if (canCancel) {
    actions.push({
      label: 'Cancel Subscription',
      icon: 'close-circle',
      iconBg: '#FF3B30',
      onPress: handleCancel,
      loading: isCancelling,
      loadingLabel: 'Cancelling...',
      destructive: true,
    })
  }

  const FEATURES = [
    { cat: 'Content Processing', items: ['Unlimited Audio Recording', 'Upload Audio & PDF Files', 'Process YouTube Videos', 'Web Page Processing'] },
    { cat: 'AI-Powered Tools', items: ['AI Note Generation', 'Smart Flashcards', 'Interactive Quizzes', 'AI Chat Assistant', 'Mind Maps'] },
    { cat: 'Premium Benefits', items: ['Multi-Language Support', 'Cloud Sync & Backup', 'Unlimited Storage', 'Priority Support', 'Export & Share'] },
  ]

  const FEATURES_FLAT = [
    { icon: 'cloud-upload' as const, text: 'Unlimited audio, PDF & YouTube' },
    { icon: 'document-text' as const, text: 'AI-powered note generation' },
    { icon: 'layers' as const, text: 'Smart flashcards & quizzes' },
    { icon: 'chatbubble-ellipses' as const, text: 'AI chat assistant' },
    { icon: 'git-network' as const, text: 'Mind maps & visualizations' },
    { icon: 'headset' as const, text: 'Podcast summaries' },
    { icon: 'globe' as const, text: 'Multi-language support' },
    { icon: 'cloud-done' as const, text: 'Cloud sync & unlimited storage' },
    { icon: 'share-social' as const, text: 'Export & share notes' },
    { icon: 'shield-checkmark' as const, text: 'Priority support' },
  ]

  return (
    <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <Feather name="arrow-left" size={24} color={c.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Subscription</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Plan hero card */}
          <View style={[styles.planCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Status badge */}
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}14`, alignSelf: 'flex-start' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>

            {/* Plan name + icon */}
            <View style={styles.planTop}>
              <View>
                <Text style={[styles.planName, { color: c.foreground }]}>{planDetails.name}</Text>
                <Text style={[styles.planSub, { color: c.mutedForeground }]}>
                  {effectiveIsTrial ? 'Trial Period' : 'Premium Plan'}
                </Text>
              </View>
              <View style={[styles.planIcon, { backgroundColor: c.primary }]}>
                <Ionicons name="diamond" size={22} color="#fff" />
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: c.foreground }]}>{planDetails.price}</Text>
              <Text style={[styles.priceInterval, { color: c.mutedForeground }]}>/{planDetails.interval}</Text>
            </View>

            {/* Detail rows inside card */}
            <View style={[styles.detailDivider, { backgroundColor: separatorColor }]} />

            <View style={styles.detailGrid}>
              {effectiveDaysRemaining !== null && (
                <View style={styles.detailItem}>
                  <View style={styles.detailLeft}>
                    <Ionicons name="calendar" size={16} color={c.mutedForeground} />
                    <Text style={[styles.detailLabel, { color: c.mutedForeground }]}>Days left</Text>
                  </View>
                  <Text style={[styles.detailValue, { color: c.primary }]}>{effectiveDaysRemaining}</Text>
                </View>
              )}
              {(effectiveSubscription.nextBillingDate || effectiveSubscription.currentPeriodEnd) && (
                <View style={styles.detailItem}>
                  <View style={styles.detailLeft}>
                    <Ionicons name="time" size={16} color={c.mutedForeground} />
                    <Text style={[styles.detailLabel, { color: c.mutedForeground }]}>
                      {effectiveIsTrial ? 'Trial ends' : 'Renews'}
                    </Text>
                  </View>
                  <Text style={[styles.detailValue, { color: c.foreground }]}>
                    {formatDate((effectiveSubscription.nextBillingDate || effectiveSubscription.currentPeriodEnd)!)}
                  </Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <View style={styles.detailLeft}>
                  <Ionicons name="repeat" size={16} color={c.mutedForeground} />
                  <Text style={[styles.detailLabel, { color: c.mutedForeground }]}>Billing</Text>
                </View>
                <Text style={[styles.detailValue, { color: c.foreground }]}>
                  {planDetails.interval === 'year' ? 'Yearly' : 'Monthly'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailLeft}>
                  <Ionicons name="card" size={16} color={c.mutedForeground} />
                  <Text style={[styles.detailLabel, { color: c.mutedForeground }]}>Via</Text>
                </View>
                <Text style={[styles.detailValue, { color: c.foreground }]}>{providerLabel}</Text>
              </View>
            </View>
          </View>

          {/* Cancel warning */}
          {effectiveSubscription.cancelAtPeriodEnd && (
            <View style={[styles.warningBanner, { backgroundColor: isDark ? 'rgba(255,149,0,0.08)' : '#FFF8EE' }]}>
              <Ionicons name="warning" size={18} color="#FF9500" />
              <Text style={[styles.warningText, { color: isDark ? '#FFB84D' : '#92400E' }]}>
                Your subscription will end at the current billing period.
              </Text>
            </View>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>MANAGE</Text>
              <View style={[styles.group, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {actions.map((action, idx) => (
                  <React.Fragment key={idx}>
                    <Pressable
                      style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.6 : 1 }]}
                      onPress={action.onPress}
                      disabled={action.loading}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: action.iconBg }]}>
                        <Ionicons name={action.icon as any} size={16} color="#fff" />
                      </View>
                      <Text
                        style={[
                          styles.actionLabel,
                          { color: action.destructive ? c.destructive : c.foreground },
                        ]}
                      >
                        {action.loading ? action.loadingLabel : action.label}
                      </Text>
                      {action.loading ? (
                        <ActivityIndicator size="small" color={c.mutedForeground} />
                      ) : (
                        <Feather name="chevron-right" size={16} color={isDark ? neutral[600] : neutral[400]} />
                      )}
                    </Pressable>
                    {idx < actions.length - 1 && (
                      <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </>
          )}

          {isSyncingBackend && (
            <Text style={[styles.syncText, { color: c.mutedForeground }]}>Syncing billing details...</Text>
          )}

          {/* What's included */}
          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>{"WHAT\u2019S INCLUDED"}</Text>
          <View style={[styles.group, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {FEATURES_FLAT.map((feat, idx) => (
              <React.Fragment key={idx}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(52,199,89,0.1)' : 'rgba(52,199,89,0.08)' }]}>
                    <Ionicons name={feat.icon} size={16} color="#34C759" />
                  </View>
                  <Text style={[styles.featureText, { color: c.foreground }]}>{feat.text}</Text>
                </View>
                {idx < FEATURES_FLAT.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 14, fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  planCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 18,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  planSub: { fontSize: 14, marginTop: 3 },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: { fontSize: 40, fontWeight: '700', letterSpacing: -1.5 },
  priceInterval: { fontSize: 16, fontWeight: '500', marginLeft: 2 },

  detailDivider: { height: StyleSheet.hairlineWidth, marginBottom: 16 },

  detailGrid: { gap: 12 },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: { fontSize: 14, fontWeight: '500' },
  detailValue: { fontSize: 15, fontWeight: '600' },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: { flex: 1, fontSize: 14, lineHeight: 20 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },

  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 56 },

  syncText: { fontSize: 13, textAlign: 'center', marginBottom: 16 },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 15, fontWeight: '500' },
})
