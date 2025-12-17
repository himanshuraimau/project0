import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'

export default function SubscriptionManager() {
  const { t } = useTranslation()
  const router = useRouter()
  const {
    subscription,
    hasAccess,
    isActive,
    isTrial,
    daysRemaining,
    isLoading
  } = useSubscription()

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

  // If user has an active subscription
  if (hasAccess && subscription) {
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
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

            {/* Subscription Details Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Plan Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>
                  {isActive && !isTrial ? 'Active' : isTrial ? 'Trial' : 'Inactive'}
                </Text>
              </View>

              {subscription.currentPeriodEnd && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {isTrial ? 'Trial Ends' : 'Renews On'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {daysRemaining !== null && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Days Remaining</Text>
                  <Text style={styles.detailValue}>{daysRemaining} days</Text>
                </View>
              )}
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

            {/* Features */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Included Features</Text>

              {[
                'Unlimited Audio Recording',
                'Upload Audio & PDF Files',
                'AI-Powered Note Generation',
                'Flashcards & Quizzes',
                'Multi-Language Support',
                'Cloud Sync & Backup',
              ].map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Feather name="check" size={16} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  // If user doesn't have a subscription - show upgrade options
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade to Premium</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Feather name="star" size={32} color="#7C3AED" />
            </View>
            <Text style={styles.heroTitle}>Unlock All Features</Text>
            <Text style={styles.heroSubtitle}>
              Boost your productivity with premium access
            </Text>
          </View>

          {/* Features */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Premium Features</Text>

            {[
              'Unlimited Audio Recording',
              'Upload Audio & PDF Files',
              'AI-Powered Note Generation',
              'Flashcards & Quizzes',
              'Multi-Language Support',
              'Cloud Sync & Backup',
            ].map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Feather name="check" size={16} color="#7C3AED" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Choose Your Plan</Text>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={styles.planOption}
              onPress={() => router.push('/(onboarding)/paywall/paywall5' as any)}
            >
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planDesc}>Perfect for trying out</Text>
              </View>
              <Text style={styles.planPrice}>$9.99<Text style={styles.planPeriod}>/mo</Text></Text>
            </TouchableOpacity>

            {/* Yearly Plan */}
            <TouchableOpacity
              style={[styles.planOption, styles.planOptionPopular]}
              onPress={() => router.push('/(onboarding)/paywall/paywall5' as any)}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planDesc}>Save 17% annually</Text>
              </View>
              <View style={styles.planPriceContainer}>
                <Text style={styles.planPrice}>$99.99<Text style={styles.planPeriod}>/yr</Text></Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save $20</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
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
    marginBottom: 20,
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
  planName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
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
})
