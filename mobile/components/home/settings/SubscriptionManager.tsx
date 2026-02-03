import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import BackButton from '@/components/ui/BackButton'

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

  // Redirect to paywall if user doesn't have a subscription
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      router.replace('/(onboarding)/paywall/paywall5' as any)
    }
  }, [isLoading, hasAccess, router])

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#FFFFFF', '#FBF7FF', '#F3E8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  // Helper function to get plan details from productId
  const getPlanDetails = () => {
    if (!subscription?.productId) {
      return { name: 'Premium', price: '$19.99', interval: 'month' }
    }

    const productId = subscription.productId.toLowerCase()

    // Check if it's a yearly plan
    if (productId.includes('yearly') || productId.includes('annual')) {
      return { name: 'Pro', price: '$89', interval: 'year' }
    }

    // Default to monthly
    return { name: 'Pro', price: '$19.99', interval: 'month' }
  }

  // If user has an active subscription, show details
  if (hasAccess && subscription) {
    const planDetails = getPlanDetails()

    return (
      <LinearGradient
        colors={['#FFFFFF', '#FBF7FF', '#F3E8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton iconColor="#374151" />
            <Text style={styles.headerTitle}>Subscription</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <Feather name="check-circle" size={20} color="#10B981" />
              <Text style={styles.statusText}>
                {isTrial ? 'Trial Active' : 'Premium Active'}
              </Text>
            </View>

            {/* Current Plan Card */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planIconContainer}>
                  <Feather name="zap" size={24} color="#7C3AED" />
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
                    <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#F59E0B' }]} />
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
                <Feather name="alert-circle" size={18} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Subscription will be cancelled at the end of the current period
                </Text>
              </View>
            )}

            {/* What's Included Section */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What's Included</Text>
              <Text style={styles.cardSubtitle}>
                Everything you need to supercharge your learning
              </Text>

              {/* Core Features */}
              <View style={styles.featureCategory}>
                <Text style={styles.featureCategoryTitle}>📝 Content Processing</Text>
                {[
                  'Unlimited Audio Recording',
                  'Upload Audio & PDF Files',
                  'Process YouTube Videos',
                  'Web Page Processing',
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* AI Features */}
              <View style={styles.featureCategory}>
                <Text style={styles.featureCategoryTitle}>🤖 AI-Powered Tools</Text>
                {[
                  'AI-Powered Note Generation',
                  'Smart Flashcards',
                  'Interactive Quizzes',
                  'AI Chatbot Assistant',
                  'Mind Maps & Visualizations',
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Additional Features */}
              <View style={styles.featureCategory}>
                <Text style={styles.featureCategoryTitle}>✨ Premium Benefits</Text>
                {[
                  'Multi-Language Support',
                  'Cloud Sync & Backup',
                  'Unlimited Storage',
                  'Priority Support',
                  'Export & Share Notes',
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Feather name="check" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  // If user doesn't have a subscription, they'll be redirected by useEffect
  // Show loading state while redirecting
  return (
    <LinearGradient
      colors={['#FFFFFF', '#FBF7FF', '#F3E8FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Redirecting...</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: '700',
    color: '#1F2937',
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
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 10,
  },
  // New Plan Card Styles
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E9D5FF',
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
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  planPriceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: -1,
  },
  planInterval: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  planDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
    color: '#6B7280',
    fontWeight: '500',
  },
  planInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
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
    color: '#7C3AED',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  featureCategory: {
    marginBottom: 24,
  },
  featureCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureText: {
    marginLeft: 14,
    fontSize: 15,
    color: '#4B5563',
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
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  planOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planOptionPopular: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planInfo: {
    flex: 1,
  },
  planDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPeriod: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  savingsText: {
    color: '#FFFFFF',
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
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
})
