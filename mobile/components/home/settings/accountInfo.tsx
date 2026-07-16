import React from 'react'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useSession } from '@/lib/auth'
import { useTranslation } from 'react-i18next'
import * as Clipboard from 'expo-clipboard'
import {
  StatusBar,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { useAlert } from '@/lib/contexts/AlertContext'
import { getSubscriptionPlanDisplay } from '@/lib/subscription/plan'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral, iconColors } from '@/lib/design-system'

export default function AccountInfo() {
  const { data: session } = useSession()
  const user = session?.user
  const { t } = useTranslation()
  const { subscription, isSubscribed } = useSubscription()
  const { showAlert } = useAlert()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const router = useRouter()

  // Liquid glass — translucent cards, content peeks through
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  const getSubscriptionDisplay = () => {
    if (!isSubscribed || !subscription) return t('accountInfo.free')
    return getSubscriptionPlanDisplay(subscription)
  }

  const copyUserId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id)
      showAlert(t('accountInfo.idCopied'), t('accountInfo.idCopiedMessage'))
    }
  }

  const userName = user?.name || 'User'
  const userEmail = user?.email || 'No email'
  const memberSince = formatDate(user?.createdAt)

  type InfoRow = {
    icon: string
    iconBg: string
    label: string
    value: string
    badge?: boolean
    badgeColor?: string
  }

  const infoRows: InfoRow[] = [
    {
      icon: 'mail',
      iconBg: iconColors.blue,
      label: t('accountInfo.email'),
      value: userEmail,
    },
    {
      icon: 'diamond',
      iconBg: isSubscribed ? iconColors.green : iconColors.purple,
      label: t('accountInfo.subscription'),
      value: getSubscriptionDisplay(),
      badge: true,
      badgeColor: isSubscribed ? iconColors.green : undefined,
    },
    {
      icon: 'calendar',
      iconBg: iconColors.orange,
      label: t('accountInfo.memberSince'),
      value: memberSince,
    },
  ]

  return (
    <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={[styles.headerWrap, { borderBottomColor: separatorColor, backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [
                styles.headerBtn,
                {
                  backgroundColor: pressed
                    ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
                    : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                },
              ]}
            >
              <Feather name="arrow-left" size={20} color={c.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>Account</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card */}
          <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.avatar, { backgroundColor: c.primary }]}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.userName, { color: c.foreground }]}>{userName}</Text>
            <Text style={[styles.userEmail, { color: c.mutedForeground }]}>{userEmail}</Text>

            <View
              style={[
                styles.subPill,
                {
                  backgroundColor: isSubscribed
                    ? (isDark ? 'rgba(52,199,89,0.12)' : 'rgba(52,199,89,0.1)')
                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                },
              ]}
            >
              <Ionicons
                name={isSubscribed ? 'checkmark-circle' : 'diamond'}
                size={14}
                color={isSubscribed ? iconColors.green : c.mutedForeground}
              />
              <Text
                style={[
                  styles.subPillText,
                  { color: isSubscribed ? iconColors.green : c.mutedForeground },
                ]}
              >
                {getSubscriptionDisplay()}
              </Text>
            </View>
          </View>

          {/* Account details */}
          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>ACCOUNT DETAILS</Text>
          <View style={[styles.group, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {infoRows.map((row, idx) => (
              <React.Fragment key={idx}>
                <View style={styles.row}>
                  <View style={[styles.iconCircle, { backgroundColor: row.iconBg }]}>
                    <Ionicons name={row.icon as any} size={16} color="#fff" />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowLabel, { color: c.mutedForeground }]}>
                      {row.label}
                    </Text>
                    {row.badge ? (
                      <View
                        style={[
                          styles.valueBadge,
                          {
                            backgroundColor: row.badgeColor
                              ? (isDark ? `${row.badgeColor}1A` : `${row.badgeColor}14`)
                              : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.valueBadgeText,
                            { color: row.badgeColor || c.foreground },
                          ]}
                        >
                          {row.value}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.rowValue, { color: c.foreground }]}>
                        {row.value}
                      </Text>
                    )}
                  </View>
                </View>
                {idx < infoRows.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Copy User ID */}
          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>SUPPORT</Text>
          <Pressable
            style={({ pressed }) => [
              styles.group,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={copyUserId}
          >
            <View style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: iconColors.gray }]}>
                <Ionicons name="copy" size={16} color="#fff" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: c.mutedForeground }]}>
                  User ID
                </Text>
                <Text style={[styles.rowValue, { color: c.foreground }]} numberOfLines={1}>
                  {user?.id || 'N/A'}
                </Text>
              </View>
              <Ionicons name="copy-outline" size={18} color={c.mutedForeground} />
            </View>
          </Pressable>
          <Text style={[styles.hintText, { color: c.mutedForeground }]}>
            Tap to copy your User ID for customer support.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  /* Header */
  headerWrap: {
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

  /* Profile card */
  profileCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    marginBottom: 16,
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subPillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Section label */
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 4,
  },

  /* Group card */
  group: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  valueBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  valueBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },

  hintText: {
    fontSize: 12,
    marginLeft: 4,
    marginTop: -8,
    marginBottom: 16,
    lineHeight: 17,
  },
})
