import React from 'react'
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
  const { theme, mode, preference, setPreference } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
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
    Linking.openURL('https://flinote.ai')
  }

  const handleRateUs = () => {
    // Add app store rating logic
  }

  const handleSubscription = () => {
    // Navigate to dedicated subscription manager
    router.push('/settings/subscription' as any)
  }

  const handlePrivacy = () => {
    Linking.openURL('https://flinote.ai/privacy')
  }

  const handleTerms = () => {
    Linking.openURL('https://flinote.ai/terms')
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
    { id: '9', icon: 'lock', label: t('settings.privacy') || 'Privacy Policy', onPress: handlePrivacy },
    { id: '10', icon: 'file-text', label: t('settings.terms') || 'Terms of Service', onPress: handleTerms },
    { id: '8', icon: 'log-out', label: t('settings.logout'), onPress: handleLogout },
  ]

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 32,
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
    title: {
      fontSize: 28,
      fontWeight: '500',
      color: c.foreground,
      letterSpacing: -0.5,
    },
    settingsButton: {
      padding: 8,
    },
    subscriptionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(0,171,98,0.15)' : '#ECFDF5',
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
      color: c.success,
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
      backgroundColor: c.card,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    optionRowLast: {},
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
      color: c.foreground,
      letterSpacing: -0.2,
    },
    optionSubtext: {
      fontSize: 13,
      fontWeight: '400',
      color: c.mutedForeground,
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
      color: c.mutedForeground,
      fontWeight: '400',
    },
    linkSeparator: {
      fontSize: 13,
      color: c.border,
      marginHorizontal: 12,
    },
    themeRow: {
      backgroundColor: c.card,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    themeRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    themeLabel: {
      fontSize: 17,
      fontWeight: '500',
      color: c.foreground,
      letterSpacing: -0.2,
      marginLeft: 16,
    },
    themePicker: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : c.muted,
      borderRadius: 10,
      padding: 3,
    },
    themeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    themeOptionActive: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : c.background,
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 2,
      elevation: isDark ? 0 : 1,
    },
    themeOptionText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.mutedForeground,
    },
    themeOptionTextActive: {
      color: c.foreground,
    },
  })

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea}>
          {/* Title Row with Logo and Settings Icon */}
          <View style={styles.titleRow}>
            <View style={styles.titleWithLogo}>
              {/* Logo/Robot Icon */}
              <Image
                source={require('@/assets/images/flinote-logo.png')}
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
              <Feather name="settings" size={24} color={c.foreground} />
            </TouchableOpacity>
          </View>

          {/* Subscription Status Badge */}
          {!subscriptionLoading && hasAccess && subscription && (
            <View style={styles.subscriptionBadge}>
              <Feather name="check-circle" size={16} color={c.success} />
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
            {settingOptions.slice(0, 3).map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionRow}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.iconContainer}>
                    <Feather name={option.icon} size={22} color={c.foreground} />
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={c.mutedForeground} />
              </TouchableOpacity>
            ))}

            {/* Theme Toggle */}
            <View style={styles.themeRow}>
              <View style={styles.themeRowTop}>
                <Feather name={isDark ? 'moon' : 'sun'} size={22} color={c.foreground} />
                <Text style={styles.themeLabel}>Appearance</Text>
              </View>
              <View style={styles.themePicker}>
                {([
                  { key: 'light' as const, icon: 'sun' as const, label: 'Light' },
                  { key: 'system' as const, icon: 'smartphone' as const, label: 'System' },
                  { key: 'dark' as const, icon: 'moon' as const, label: 'Dark' },
                ]).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.themeOption, preference === opt.key && styles.themeOptionActive]}
                    onPress={() => setPreference(opt.key)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={opt.icon}
                      size={14}
                      color={preference === opt.key ? c.foreground : c.mutedForeground}
                    />
                    <Text style={[styles.themeOptionText, preference === opt.key && styles.themeOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {settingOptions.slice(3).map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionRow}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.iconContainer}>
                    <Feather
                      name={option.icon}
                      size={22}
                      color={option.id === '7' && hasAccess ? c.success : c.foreground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.optionLabel,
                      option.id === '7' && hasAccess && { color: c.success }
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
                <Feather name="chevron-right" size={20} color={c.mutedForeground} />
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
      </View>
    </>
  )
}
