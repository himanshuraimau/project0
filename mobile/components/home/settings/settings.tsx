import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
import { useTranslation } from 'react-i18next'
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Image,
} from 'react-native'
import { deleteUserAccount } from '@/lib/api/user'
import { authClient } from '@/lib/auth/auth-client'
import { useAlert } from '@/lib/contexts/AlertContext'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'

interface SettingOption {
  id: string
  icon: keyof typeof Feather.glyphMap
  label: string
  onPress: () => void
}

export default function Settings() {
  const { theme } = useTheme()
  const router = useRouter()
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const {
    subscription,
    hasAccess,
    isActive,
    isTrial,
    isLoading: subscriptionLoading
  } = useSubscription()

  // DEBUG LOGGING
  React.useEffect(() => {
    console.log('═══════════════════════════════════════════');
    console.log('⚙️ SETTINGS SCREEN - SUBSCRIPTION STATE:');
    console.log('═══════════════════════════════════════════');
    console.log('subscriptionLoading:', subscriptionLoading);
    console.log('hasAccess:', hasAccess);
    console.log('isActive:', isActive);
    console.log('isTrial:', isTrial);
    console.log('subscription:', subscription);
    console.log('Display logic result:');
    console.log('  - Should show badge:', !subscriptionLoading && hasAccess && subscription);
    console.log('  - Badge text:', isActive && !isTrial
      ? 'Premium Active'
      : isTrial
        ? 'Trial Active'
        : 'Premium Active');
    console.log('═══════════════════════════════════════════');
  }, [subscriptionLoading, hasAccess, isActive, isTrial, subscription]);

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      // Don't manually navigate - the home layout will detect no session
      // and redirect to the landing page automatically
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleAccountInfo = () => {
    router.push('/(home)/accountInfo')
  }

  const handleChangeLanguage = () => {
    router.push('/(home)/changeLanguage')
  }

  const handleNotifications = () => {
    console.log('Navigate to Notifications')
    // Add navigation logic
  }

  const handleContactSupport = () => {
    router.push('/(home)/support')
  }

  const handleGoToWebsite = () => {
    Linking.openURL('https://https://project0-nu.vercel.app')
  }

  const handleRateUs = () => {
    // Add app store rating logic
  }

  const handleSubscription = () => {
    // Navigate to dedicated subscription manager
    router.push('/settings/subscription' as any)
  }

  const handlePrivacy = () => {
    Linking.openURL('https://https://project0-nu.vercel.app/privacy')
  }

  const handleTerms = () => {
    Linking.openURL('https://https://project0-nu.vercel.app/terms')
  }

  const handleDeleteAccount = () => {
    showAlert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount()
              await authClient.signOut()
              // Auth state change will trigger automatic redirect via layout
            } catch (error) {
              console.error('Error deleting account:', error)
              showAlert(t('common.error'), t('settings.deleteAccountError'))
            }
          },
        },
      ]
    )
  }

  const settingOptions: SettingOption[] = [
    { id: '1', icon: 'user', label: t('settings.accountInfo'), onPress: handleAccountInfo },
    { id: '2', icon: 'globe', label: t('settings.changeLanguage'), onPress: handleChangeLanguage },
    { id: '3', icon: 'bell', label: t('settings.notifications'), onPress: handleNotifications },
    { id: '4', icon: 'message-circle', label: t('settings.contactSupport'), onPress: handleContactSupport },
    { id: '5', icon: 'external-link', label: t('settings.goToWebsite'), onPress: handleGoToWebsite },
    { id: '6', icon: 'star', label: t('settings.rateUs'), onPress: handleRateUs },
    {
      id: '7',
      icon: hasAccess ? 'check-circle' : 'bar-chart-2',
      label: hasAccess ? t('settings.manageSubscription') || 'Manage Subscription' : t('settings.subscription'),
      onPress: handleSubscription
    },
    { id: '8', icon: 'log-out', label: t('settings.logout'), onPress: handleLogout },
  ]

  return (
    <>
      <LinearGradient
        colors={[theme.colors.background, '#FBF7FF', '#F3E8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Title Row with Logo and Settings Icon */}
          <View style={styles.titleRow}>
            <View style={styles.titleWithLogo}>
              {/* Logo/Robot Icon */}
              <Image
                source={require('@/assets/images/main-logo.png')}
                style={styles.logoContainer}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t('common.Flinote')}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              accessibilityLabel="Settings"
              onPress={() => router.back()}
            >
              <Feather name="settings" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Subscription Status Badge */}
          {!subscriptionLoading && hasAccess && subscription && (
            <View style={styles.subscriptionBadge}>
              <Feather name="check-circle" size={16} color="#10B981" />
              <Text style={styles.subscriptionBadgeText}>
                {isActive && !isTrial
                  ? t('settings.premiumActive') || 'Premium Active'
                  : isTrial
                    ? t('settings.trialActive') || 'Trial Active'
                    : t('settings.premiumActive') || 'Premium Active'}
              </Text>
            </View>
          )}

          {/* Settings Options List */}
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {settingOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionRow,
                  index === settingOptions.length - 1 && styles.optionRowLast,
                ]}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.iconContainer}>
                    <Feather
                      name={option.icon}
                      size={22}
                      color={option.id === '7' && hasAccess ? '#10B981' : '#374151'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.optionLabel,
                      option.id === '7' && hasAccess && { color: '#059669' }
                    ]}>
                      {option.label}
                    </Text>
                    {option.id === '7' && hasAccess && subscription && (
                      <Text style={styles.optionSubtext}>
                        {isActive && !isTrial
                          ? t('settings.activeUntil') || 'Active'
                          : isTrial
                            ? t('settings.trial') || 'Trial'
                            : t('settings.activeUntil') || 'Active'}
                        {subscription.currentPeriodEnd &&
                          ` • ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                      </Text>
                    )}
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom Links */}
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={handlePrivacy}>
              <Text style={styles.linkText}>{t('settings.privacy')}</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity onPress={handleTerms}>
              <Text style={styles.linkText}>{t('settings.terms')}</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Text style={styles.linkText}>{t('settings.deleteAccount')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  timeBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  titleWithLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  robotHead: {
    width: 28,
    height: 28,
    backgroundColor: '#1F2937',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  robotEye: {
    width: 6,
    height: 6,
    backgroundColor: '#60A5FA',
    borderRadius: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  settingsButton: {
    padding: 8,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  subscriptionBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
  },
  optionsList: {
    flex: 1,
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  optionSubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 16,
  },
  linkText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  linkSeparator: {
    fontSize: 13,
    color: '#D1D5DB',
    marginHorizontal: 12,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#1F2937',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
    opacity: 0.3,
  },
})
