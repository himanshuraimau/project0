import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    )
  }

  // If user has an active subscription
  if (hasAccess && subscription) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Active Subscription Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Feather name="check-circle" size={48} color="#fff" />
            <Text style={styles.headerTitle}>
              {isTrial ? t('subscription.trialActive') || 'Trial Active' : t('subscription.premiumActive') || 'Premium Active'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t('subscription.thankYou') || 'Thank you for being a premium member!'}
            </Text>
          </LinearGradient>
        </View>

        {/* Subscription Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('subscription.details') || 'Subscription Details'}</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Feather name="activity" size={20} color="#6366F1" />
              <Text style={styles.detailLabel}>{t('subscription.status') || 'Status'}</Text>
            </View>
            <Text style={styles.detailValue}>
              {isActive && !isTrial ? t('subscription.active') || 'Active' : isTrial ? t('subscription.trial') || 'Trial' : t('subscription.inactive') || 'Inactive'}
            </Text>
          </View>

          {subscription.currentPeriodEnd && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Feather name="calendar" size={20} color="#6366F1" />
                <Text style={styles.detailLabel}>
                  {isTrial ? t('subscription.trialEnds') || 'Trial Ends' : t('subscription.renewsOn') || 'Renews On'}
                </Text>
              </View>
              <Text style={styles.detailValue}>
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </Text>
            </View>
          )}

          {daysRemaining !== null && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Feather name="clock" size={20} color="#6366F1" />
                <Text style={styles.detailLabel}>{t('subscription.daysRemaining') || 'Days Remaining'}</Text>
              </View>
              <Text style={styles.detailValue}>{daysRemaining} days</Text>
            </View>
          )}

          {subscription.cancelAtPeriodEnd && (
            <View style={styles.warningBox}>
              <Feather name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                {t('subscription.cancelWarning') || 'Your subscription will be cancelled at the end of the current period'}
              </Text>
            </View>
          )}
        </View>

        {/* Features Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('subscription.includedFeatures') || 'Included Features'}</Text>
          
          {[
            { icon: 'mic', label: t('subscription.features.recordAudio') || 'Unlimited Audio Recording' },
            { icon: 'file-text', label: t('subscription.features.uploadFiles') || 'Upload Audio & PDF Files' },
            { icon: 'zap', label: t('subscription.features.aiNotes') || 'AI-Powered Note Generation' },
            { icon: 'book-open', label: t('subscription.features.flashcards') || 'Flashcards & Quizzes' },
            { icon: 'globe', label: t('subscription.features.translation') || 'Multi-Language Support' },
            { icon: 'cloud', label: t('subscription.features.cloudSync') || 'Cloud Sync & Backup' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Feather name={feature.icon as any} size={18} color="#10B981" />
              <Text style={styles.featureText}>{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>
              {t('common.back') || 'Back to Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  // If user doesn't have a subscription - show upgrade options
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* No Subscription Header */}
      <View style={styles.header}>
        <View style={styles.headerNoSub}>
          <Feather name="star" size={48} color="#8B5CF6" />
          <Text style={styles.headerTitleDark}>
            {t('subscription.upgradeToPremium') || 'Upgrade to Premium'}
          </Text>
          <Text style={styles.headerSubtitleDark}>
            {t('subscription.unlockAllFeatures') || 'Unlock all features and boost your productivity'}
          </Text>
        </View>
      </View>

      {/* Features Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('subscription.premiumFeatures') || 'Premium Features'}</Text>
        
        {[
          { icon: 'mic', label: t('subscription.features.recordAudio') || 'Unlimited Audio Recording' },
          { icon: 'file-text', label: t('subscription.features.uploadFiles') || 'Upload Audio & PDF Files' },
          { icon: 'zap', label: t('subscription.features.aiNotes') || 'AI-Powered Note Generation' },
          { icon: 'book-open', label: t('subscription.features.flashcards') || 'Flashcards & Quizzes' },
          { icon: 'globe', label: t('subscription.features.translation') || 'Multi-Language Support' },
          { icon: 'cloud', label: t('subscription.features.cloudSync') || 'Cloud Sync & Backup' },
        ].map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Feather name={feature.icon as any} size={18} color="#8B5CF6" />
            <Text style={styles.featureText}>{feature.label}</Text>
          </View>
        ))}
      </View>

      {/* Pricing Options */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('subscription.choosePlan') || 'Choose Your Plan'}</Text>
        
        {/* Monthly Plan */}
        <TouchableOpacity 
          style={styles.planCard}
          onPress={() => router.push('/(onboarding)/paywall/paywall5' as any)}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{t('subscription.monthly') || 'Monthly'}</Text>
            <View style={styles.planPrice}>
              <Text style={styles.planAmount}>$9.99</Text>
              <Text style={styles.planPeriod}>/month</Text>
            </View>
          </View>
          <Text style={styles.planDescription}>
            {t('subscription.monthlyDescription') || 'Perfect for trying out premium features'}
          </Text>
        </TouchableOpacity>

        {/* Yearly Plan */}
        <TouchableOpacity 
          style={[styles.planCard, styles.planCardPopular]}
          onPress={() => router.push('/(onboarding)/paywall/paywall5' as any)}
        >
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>{t('subscription.popular') || 'MOST POPULAR'}</Text>
          </View>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{t('subscription.yearly') || 'Yearly'}</Text>
            <View style={styles.planPrice}>
              <Text style={styles.planAmount}>$99.99</Text>
              <Text style={styles.planPeriod}>/year</Text>
            </View>
          </View>
          <Text style={styles.planDescription}>
            {t('subscription.yearlyDescription') || 'Save 17% with annual billing'}
          </Text>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{t('subscription.save17') || 'Save $20/year'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>
            {t('common.back') || 'Back to Settings'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerNoSub: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  headerTitleDark: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  headerSubtitleDark: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#92400E',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  planCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planCardPopular: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  planPeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
})
