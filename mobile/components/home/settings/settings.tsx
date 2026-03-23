import React from 'react'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
import { useTranslation } from 'react-i18next'
import {
  StatusBar,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { deleteUserAccount } from '@/lib/api/user'
import { authClient, useSession } from '@/lib/auth/auth-client'
import { useAlert } from '@/lib/contexts/AlertContext'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { neutral } from '@/lib/design-system'
import { glass, glassShadow } from '@/lib/design-system/glass'

export default function Settings() {
  const { theme, mode, preference, setPreference } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const router = useRouter()
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const { data: session } = useSession()
  const { subscription, hasAccess, isActive, isTrial, isLoading: subscriptionLoading } = useSubscription()

  const handleLogout = async () => {
    try {
      await authClient.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleDeleteAccount = () => {
    // Check subscription status first
    if (hasAccess && (isActive || isTrial)) {
      showAlert(
        t('settings.deleteAccount'),
        'Please cancel your subscription before deleting your account.',
        [{ text: t('common.ok'), style: 'cancel' }]
      )
      return
    }

    // Show confirmation dialog
    showAlert(
      t('settings.deleteAccount'),
      'Your account will be permanently deleted and cannot be recovered. If you have an active subscription, you must cancel it first before deleting your account.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount()
              await authClient.signOut()
            } catch (error) {
              showAlert(t('common.error'), 'Failed to delete account. Please try again or contact support.')
            }
          },
        },
      ]
    )
  }

  const separatorColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  type SettingItem = {
    icon: string
    iconBg: string
    iconColor?: string
    label: string
    onPress: () => void
    chevron?: boolean
    subtitle?: string
    destructive?: boolean
  }

  const accountSection: SettingItem[] = [
    {
      icon: 'person',
      iconBg: '#007AFF',
      label: t('settings.accountInfo'),
      onPress: () => router.push('/(home)/accountInfo'),
      chevron: true,
    },
    {
      icon: hasAccess ? 'checkmark-circle' : 'diamond',
      iconBg: hasAccess ? '#34C759' : '#AF52DE',
      label: hasAccess
        ? (t('settings.manageSubscription') || 'Manage Subscription')
        : t('settings.subscription'),
      subtitle: hasAccess && subscription
        ? (isTrial ? 'Trial Active' : 'Premium Active')
        : undefined,
      onPress: () => router.push('/settings/subscription' as any),
      chevron: true,
    },
  ]

  const preferencesSection: SettingItem[] = [
    {
      icon: 'globe',
      iconBg: '#5856D6',
      label: t('settings.changeLanguage'),
      onPress: () => router.push('/(home)/changeLanguage'),
      chevron: true,
    },
  ]

  const supportSection: SettingItem[] = [
    {
      icon: 'chatbubble',
      iconBg: '#34C759',
      label: t('settings.contactSupport'),
      onPress: () => router.push('/(home)/support'),
      chevron: true,
    },
    {
      icon: 'open-outline',
      iconBg: '#007AFF',
      label: t('settings.goToWebsite'),
      onPress: () => Linking.openURL('https://flinote.ai'),
      chevron: true,
    },
  ]

  const legalSection: SettingItem[] = [
    {
      icon: 'shield-checkmark',
      iconBg: '#8E8E93',
      label: t('settings.privacy') || 'Privacy Policy',
      onPress: () => Linking.openURL('https://flinote.ai/privacy'),
      chevron: true,
    },
    {
      icon: 'document-text',
      iconBg: '#8E8E93',
      label: t('settings.terms') || 'Terms of Service',
      onPress: () => Linking.openURL('https://flinote.ai/terms'),
      chevron: true,
    },
  ]

  const dangerSection: SettingItem[] = [
    {
      icon: 'log-out-outline',
      iconBg: '#FF9500',
      label: t('settings.logout'),
      onPress: handleLogout,
      chevron: false,
      destructive: false,
    },
    {
      icon: 'trash',
      iconBg: '#FF3B30',
      label: t('settings.deleteAccount'),
      onPress: handleDeleteAccount,
      chevron: false,
      destructive: true,
    },
  ]

  /* ── Liquid Glass card wrapper ──────────────────────────────────── */
  // Liquid glass — translucent cards, content peeks through
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'

  const LiquidCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View
      style={[
        styles.glassCard,
        { borderColor: cardBorder, backgroundColor: cardBg },
        style,
      ]}
    >
      {children}
    </View>
  )

  const renderGroup = (items: SettingItem[]) => (
    <LiquidCard>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed
                  ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)')
                  : 'transparent',
              },
            ]}
            onPress={item.onPress}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
              <Ionicons
                name={item.icon as any}
                size={18}
                color={item.iconColor || '#fff'}
              />
            </View>
            <View style={styles.rowContent}>
              <Text
                style={[
                  styles.rowLabel,
                  { color: item.destructive ? c.destructive : c.foreground },
                ]}
              >
                {item.label}
              </Text>
              {item.subtitle && (
                <Text style={[styles.rowSubtitle, { color: c.success }]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            {item.chevron && (
              <Feather name="chevron-right" size={18} color={isDark ? neutral[500] : neutral[400]} />
            )}
          </Pressable>
          {idx < items.length - 1 && (
            <View style={[styles.separator, { backgroundColor: separatorColor }]} />
          )}
        </React.Fragment>
      ))}
    </LiquidCard>
  )

  return (
    <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Liquid Glass Header Bar ──────────────────────────────── */}
        <View style={[styles.headerWrap, { borderBottomColor: separatorColor, backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>

          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [
                styles.headerBtn,
                {
                  backgroundColor: pressed
                    ? (isDark ? glass.heavy : 'rgba(0,0,0,0.06)')
                    : (isDark ? glass.light : 'rgba(0,0,0,0.03)'),
                },
              ]}
            >
              <Feather name="arrow-left" size={20} color={c.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>Settings</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── User Card ─────────────────────────────────────────── */}
          <LiquidCard style={styles.userCard}>
            <View style={[styles.avatar, { backgroundColor: c.primary }]}>
              <Text style={styles.avatarText}>
                {(session?.user?.name || session?.user?.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: c.foreground }]} numberOfLines={1}>
                {session?.user?.name || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: c.mutedForeground }]} numberOfLines={1}>
                {session?.user?.email || ''}
              </Text>
            </View>
          </LiquidCard>

          {/* ── Upgrade Banner (Liquid Glass tinted) ──────────────── */}
          {!subscriptionLoading && !hasAccess && (
            <Pressable
              style={({ pressed }) => [
                styles.upgradeBanner,
                {
                  borderColor: isDark ? 'rgba(79,59,231,0.35)' : 'rgba(79,59,231,0.25)',
                  ...glassShadow.md,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={() => router.push('/settings/subscription' as any)}
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: isDark ? 'rgba(79,59,231,0.85)' : 'rgba(79,59,231,0.9)' },
                ]}
              />
              <Ionicons name="diamond" size={20} color="#fff" />
              <Text style={[styles.upgradeText, { color: '#fff' }]}>
                Get Unlimited Notes
              </Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          )}

          {/* ── Appearance ────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>APPEARANCE</Text>
          <LiquidCard>
            <View style={styles.themeRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#5856D6' : '#FF9500' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color="#fff" />
              </View>
              <View
                style={[
                  styles.themePicker,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  },
                ]}
              >
                {([
                  { key: 'light' as const, icon: 'sunny' as const, label: 'Light' },
                  { key: 'system' as const, icon: 'phone-portrait' as const, label: 'Auto' },
                  { key: 'dark' as const, icon: 'moon' as const, label: 'Dark' },
                ]).map((opt) => {
                  const isActive = preference === opt.key
                  return (
                    <Pressable
                      key={opt.key}
                      style={[
                        styles.themeOption,
                        isActive && [
                          styles.themeOptionActive,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.14)'
                              : 'rgba(255,255,255,0.9)',
                          },
                        ],
                      ]}
                      onPress={() => setPreference(opt.key)}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={14}
                        color={isActive ? c.foreground : c.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.themeText,
                          { color: isActive ? c.foreground : c.mutedForeground },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </LiquidCard>

          {/* ── Sections ──────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>ACCOUNT</Text>
          {renderGroup(accountSection)}

          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>PREFERENCES</Text>
          {renderGroup(preferencesSection)}

          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>SUPPORT</Text>
          {renderGroup(supportSection)}

          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>LEGAL</Text>
          {renderGroup(legalSection)}

          {renderGroup(dangerSection)}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  /* ── Liquid Glass Header ──────────────────────────────────────────── */
  headerWrap: {
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  /* ── Liquid Glass Card (shared) ───────────────────────────────────── */
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  /* ── User Card ────────────────────────────────────────────────────── */
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  userEmail: { fontSize: 14 },

  /* ── Upgrade Banner ───────────────────────────────────────────────── */
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 10,
    overflow: 'hidden',
  },
  upgradeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  /* ── Section Label ────────────────────────────────────────────────── */
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },

  /* ── Row ───────────────────────────────────────────────────────────── */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  rowSubtitle: { fontSize: 13, fontWeight: '500', marginTop: 1 },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },

  /* ── Theme Picker ─────────────────────────────────────────────────── */
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  themePicker: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  themeOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  themeText: {
    fontSize: 13,
    fontWeight: '500',
  },
})
