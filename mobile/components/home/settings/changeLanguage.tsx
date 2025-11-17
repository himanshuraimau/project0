import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/lib/hooks/useTheme'
import { LANGUAGES, setLanguage } from '@/lib/i18n/i18n'
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'

interface LanguageOptionProps {
  code: string
  name: string
  nativeName: string
  flag: string
  isSelected: boolean
  isCurrent: boolean
  onPress: () => void
  isChanging: boolean
}

const LanguageOption: React.FC<LanguageOptionProps> = ({
  code,
  name,
  nativeName,
  flag,
  isSelected,
  isCurrent,
  onPress,
  isChanging,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.languageOption,
        isSelected && styles.languageOptionSelected,
      ]}
      onPress={onPress}
      disabled={isChanging}
      activeOpacity={0.7}
    >
      <View style={styles.languageLeft}>
        <View
          style={[
            styles.radioCircle,
            isSelected && styles.radioCircleSelected,
          ]}
        >
          {isSelected && <View style={styles.radioCircleInner} />}
        </View>
        <Text style={styles.flagEmoji}>{flag}</Text>
        <View style={styles.languageTextContainer}>
          <Text style={styles.languageName}>{nativeName}</Text>
          <Text style={styles.languageSubName}>{name}</Text>
        </View>
      </View>
      <View style={styles.languageRight}>
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
        {isChanging && isSelected && (
          <ActivityIndicator size="small" color="#8B5CF6" style={{ marginLeft: 8 }} />
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function ChangeLanguage() {
  const { theme } = useTheme()
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [isChanging, setIsChanging] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language) {
      return // Already selected
    }

    setIsChanging(true)
    setSelectedLanguage(languageCode)

    try {
      await setLanguage(languageCode)
      
      // Show success message
      setTimeout(() => {
        Alert.alert(
          t('language.languageChanged'),
          t('language.languageChangedMessage'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.back(),
            },
          ]
        )
      }, 300)
    } catch (error) {
      console.error('Error changing language:', error)
      Alert.alert(t('common.error'), t('language.errorChanging'))
      setSelectedLanguage(i18n.language) // Revert selection
    } finally {
      setIsChanging(false)
    }
  }

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
              <Text style={styles.timeText}>
                {new Date().toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
            </View>
            <View style={styles.statusIcons}>
              <Feather name="wifi" size={18} color="#222" style={{ marginRight: 8 }} />
              <Feather name="battery" size={18} color="#222" />
            </View>
          </View>

          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel={t('common.back')}
            >
              <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{t('language.title')}</Text>
              <Text style={styles.headerSubtitle}>{t('language.subtitle')}</Text>
            </View>
          </View>

          {/* Language Options List */}
          <ScrollView
            style={styles.languagesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.languagesListContent}
          >
            <Text style={styles.sectionTitle}>{t('language.available')}</Text>
            {Object.entries(LANGUAGES).map(([code, { name, nativeName, flag }]) => (
              <LanguageOption
                key={code}
                code={code}
                name={name}
                nativeName={nativeName}
                flag={flag}
                isSelected={selectedLanguage === code}
                isCurrent={i18n.language === code}
                onPress={() => handleLanguageChange(code)}
                isChanging={isChanging}
              />
            ))}
          </ScrollView>

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
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleContainer: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  languagesList: {
    flex: 1,
  },
  languagesListContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  languageOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#8B5CF6',
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
  },
  flagEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  languageSubName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  languageRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
