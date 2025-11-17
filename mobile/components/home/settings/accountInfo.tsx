import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
import { useUser } from '@clerk/clerk-expo'
import { useTranslation } from 'react-i18next'
import * as Clipboard from 'expo-clipboard'
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'

interface InfoCardProps {
  icon: keyof typeof Feather.glyphMap
  label: string
  value: string
  iconBackgroundColor: string
  isPill?: boolean
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, iconBackgroundColor, isPill }) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]}>
        <Feather name={icon} size={20} color="#FFF" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>{label}</Text>
        {isPill ? (
          <View style={styles.pillContainer}>
            <Text style={styles.pillText}>{value}</Text>
          </View>
        ) : (
          <Text style={styles.cardValue}>{value}</Text>
        )}
      </View>
    </View>
  )
}

export default function AccountInfo() {
  const { theme } = useTheme()
  const router = useRouter()
  const { user } = useUser()
  const { t } = useTranslation()

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  const copyUserId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id)
      Alert.alert(t('accountInfo.idCopied'), t('accountInfo.idCopiedMessage'))
    }
  }

  const userName = user?.fullName || user?.firstName || 'User'
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'No email'
  const memberSince = formatDate(user?.createdAt)

  return (
    <>
      <LinearGradient
        colors={['#FFFFFF', '#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Time and Status Icons */}
          <View style={styles.topBar}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>
                {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
              </Text>
            </View>
            <View style={styles.statusIcons}>
              <Feather name="wifi" size={18} color="#222" style={{ marginRight: 8 }} />
              <Feather name="battery" size={18} color="#222" />
            </View>
          </View>

          {/* Back Button and Title */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              accessibilityLabel="Go back"
            >
              <Feather name="arrow-left" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profilePicture}>
                {user?.imageUrl ? (
                  <Text style={styles.profileInitial}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <Feather name="user" size={48} color="#9CA3AF" />
                )}
              </View>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            {/* Account Details Header */}
            <Text style={styles.sectionHeader}>{t('accountInfo.title')}</Text>

            {/* Account Information Cards */}
            <View style={styles.cardsContainer}>
              <InfoCard
                icon="mail"
                label={t('accountInfo.email')}
                value={userEmail}
                iconBackgroundColor="#93C5FD"
              />
              <InfoCard
                icon="award"
                label={t('accountInfo.subscription')}
                value={t('accountInfo.free')}
                iconBackgroundColor="#A78BFA"
                isPill
              />
              <InfoCard
                icon="calendar"
                label={t('accountInfo.memberSince')}
                value={memberSince}
                iconBackgroundColor="#FDBA74"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity onPress={copyUserId} style={styles.footer}>
            <Text style={styles.footerText}>{t('accountInfo.customerSupport')}</Text>
          </TouchableOpacity>

          {/* iOS Home Indicator */}
          <View style={styles.homeIndicator} />
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
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
  header: {
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  pillContainer: {
    backgroundColor: '#E5E7EB',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
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
