import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native'
import { useClerk } from '@clerk/clerk-expo'

interface SettingOption {
  id: string
  icon: keyof typeof Feather.glyphMap
  label: string
  onPress: () => void
}

export default function Settings() {
  const { theme } = useTheme()
  const router = useRouter()
  const { signOut } = useClerk()

  const handleLogout = async () => {
    try {
      await signOut()
      Linking.openURL('/') // Redirect to the home page
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const handleAccountInfo = () => {
    router.push('/(drawer)/(home)/accountInfo')
  }

  const handleChangeLanguage = () => {
    console.log('Navigate to Change Language')
    // Add navigation logic
  }

  const handleNotifications = () => {
    console.log('Navigate to Notifications')
    // Add navigation logic
  }

  const handleContactSupport = () => {
    console.log('Navigate to Contact Support')
    // Add navigation logic or open email
  }

  const handleGoToWebsite = () => {
    Linking.openURL('https://jellinote.ai')
  }

  const handleRateUs = () => {
    console.log('Navigate to Rate Us')
    // Add app store rating logic
  }

  const handleSubscription = () => {
    console.log('Navigate to Subscription')
    // Add navigation logic
  }

  const handlePrivacy = () => {
    Linking.openURL('https://jellinote.ai/privacy')
  }

  const handleTerms = () => {
    Linking.openURL('https://jellinote.ai/terms')
  }

  const handleDeleteAccount = () => {
    console.log('Navigate to Delete Account')
    // Add delete account logic
  }

  const settingOptions: SettingOption[] = [
    { id: '1', icon: 'user', label: 'Account Info', onPress: handleAccountInfo },
    { id: '2', icon: 'globe', label: 'Change Language', onPress: handleChangeLanguage },
    { id: '3', icon: 'bell', label: 'Notifications', onPress: handleNotifications },
    { id: '4', icon: 'message-circle', label: 'Contact support', onPress: handleContactSupport },
    { id: '5', icon: 'external-link', label: 'Go to website', onPress: handleGoToWebsite },
    { id: '6', icon: 'star', label: 'Rate us', onPress: handleRateUs },
    { id: '7', icon: 'bar-chart-2', label: 'Subscription', onPress: handleSubscription },
    { id: '8', icon: 'log-out', label: 'Log out', onPress: handleLogout },
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
          {/* Header with Time and Status Icons */}
          <View style={styles.topBar}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>4:19</Text>
            </View>
            <View style={styles.statusIcons}>
              <Feather name="wifi" size={18} color="#222" style={{ marginRight: 8 }} />
              <Feather name="battery" size={18} color="#222" />
            </View>
          </View>

          {/* Title Row with Logo and Settings Icon */}
          <View style={styles.titleRow}>
            <View style={styles.titleWithLogo}>
              {/* Logo/Robot Icon */}
              <View style={styles.logoContainer}>
                <View style={styles.robotHead}>
                  <View style={styles.robotEye} />
                  <View style={styles.robotEye} />
                </View>
              </View>
              <Text style={styles.title}>Jellinote AI</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton} 
              accessibilityLabel="Settings"
              onPress={() => router.back()}
            >
              <Feather name="settings" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

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
                    <Feather name={option.icon} size={22} color="#374151" />
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom Links */}
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={handlePrivacy}>
              <Text style={styles.linkText}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity onPress={handleTerms}>
              <Text style={styles.linkText}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Text style={styles.linkText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

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
    marginBottom: 32,
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
