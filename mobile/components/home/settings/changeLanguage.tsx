import React, { useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/lib/hooks/useTheme'
import { LANGUAGES, setLanguage } from '@/lib/i18n/i18n'
import { translateAllNotes, TranslationProgress } from '@/lib/service/noteTranslation'
import { BlurView } from 'expo-blur'
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native'
import BackButton from '@/components/ui/BackButton'
import { useAlert } from '@/lib/contexts/AlertContext';

interface LanguageOptionProps {
  code: string
  name: string
  nativeName: string
  flag: string
  isSelected: boolean
  isCurrent: boolean
  onPress: () => void
  isChanging: boolean
  c: any
  isDark: boolean
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
  c,
  isDark,
}) => {
  const styles = StyleSheet.create({
    languageOption: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.card,
      borderRadius: 14,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    },
    languageOptionSelected: {
      borderColor: c.primary,
      borderWidth: 2,
      backgroundColor: isDark ? 'rgba(130,100,255,0.12)' : c.accent,
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
      borderColor: c.border,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioCircleSelected: {
      borderColor: c.primary,
    },
    radioCircleInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.primary,
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
      color: c.foreground,
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    languageSubName: {
      fontSize: 14,
      fontWeight: '400',
      color: c.mutedForeground,
      letterSpacing: -0.1,
    },
    languageRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currentBadge: {
      backgroundColor: c.success,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    currentBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.successForeground,
      letterSpacing: 0.3,
    },
  })

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
          <ActivityIndicator size="small" color={c.primary} style={{ marginLeft: 8 }} />
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function ChangeLanguage() {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [isChanging, setIsChanging] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress | null>(null)
  const [showTranslationModal, setShowTranslationModal] = useState(false)
  const { showAlert } = useAlert();

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language) {
      return // Already selected
    }

    setIsChanging(true)
    setSelectedLanguage(languageCode)

    try {
      // First, change the app language
      await setLanguage(languageCode)

      // Show translation modal and start translating notes
      setShowTranslationModal(true)

      // Get language name for display
      const languageName = LANGUAGES[languageCode as keyof typeof LANGUAGES]?.nativeName || languageCode

      // Translate all notes in the background
      const result = await translateAllNotes(languageCode, (progress) => {
        setTranslationProgress(progress)
      })

      // Hide translation modal
      setShowTranslationModal(false)
      setTranslationProgress(null)

      // Show appropriate success/partial success message
      setTimeout(() => {
        if (result.success) {
          if (result.failedCount === 0) {
            // All notes translated successfully
            showAlert(
              t('language.translationComplete'),
              t('language.translationCompleteMessage', {
                count: result.translatedCount,
                total: result.totalNotes,
              }),
              [
                {
                  text: t('common.ok'),
                  onPress: () => router.back(),
                },
              ]
            )
          } else {
            // Partial success
            showAlert(
              t('language.translationPartialSuccess'),
              t('language.translationPartialMessage', {
                success: result.translatedCount,
                failed: result.failedCount,
              }),
              [
                {
                  text: t('common.ok'),
                  onPress: () => router.back(),
                },
              ]
            )
          }
        } else {
          // Translation failed but language was changed
          showAlert(
            t('language.languageChanged'),
            t('language.translationFailedMessage'),
            [
              {
                text: t('common.ok'),
                onPress: () => router.back(),
              },
            ]
          )
        }
      }, 300)
    } catch (error) {
      console.error('Error changing language:', error)
      setShowTranslationModal(false)
      setTranslationProgress(null)
      showAlert(t('common.error'), t('language.errorChanging'))
      setSelectedLanguage(i18n.language) // Revert selection
    } finally {
      setIsChanging(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 20,
      marginVertical: 40,
    },
    header: {
      marginBottom: 32,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '500',
      color: c.foreground,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      fontWeight: '400',
      color: c.mutedForeground,
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
      color: c.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 16,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBlur: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? 'rgba(23,24,26,0.92)' : 'rgba(255,255,255,0.92)',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 32,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      borderBottomWidth: 0,
    },
    modalIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? 'rgba(130,100,255,0.12)' : c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '500',
      color: c.foreground,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      fontSize: 15,
      fontWeight: '500',
      color: c.mutedForeground,
      textAlign: 'center',
      marginBottom: 4,
      letterSpacing: -0.2,
    },
    modalCurrentNote: {
      fontSize: 13,
      fontWeight: '400',
      color: c.mutedForeground,
      textAlign: 'center',
      fontStyle: 'italic',
      paddingHorizontal: 16,
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: c.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 20,
    },
    progressBar: {
      height: '100%',
      backgroundColor: c.primary,
      borderRadius: 4,
    },
  })

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <BackButton iconColor={c.foreground} />
            <Text style={styles.headerTitle}>{t('language.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('language.subtitle')}</Text>
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
                c={c}
                isDark={isDark}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Translation Progress Modal */}
      <Modal
        visible={showTranslationModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={styles.modalBlur}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Feather name="globe" size={40} color={c.primary} />
              </View>
              <Text style={styles.modalTitle}>{t('language.translatingNotes')}</Text>
              <Text style={styles.modalSubtitle}>
                {translationProgress
                  ? t('language.translationProgress', {
                    current: translationProgress.completed,
                    total: translationProgress.total,
                  })
                  : t('common.loading')}
              </Text>
              {translationProgress && translationProgress.currentNote && (
                <Text style={styles.modalCurrentNote} numberOfLines={1}>
                  {translationProgress.currentNote}
                </Text>
              )}
              <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 20 }} />
              {translationProgress && (
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${(translationProgress.completed / translationProgress.total) * 100}%`
                      }
                    ]}
                  />
                </View>
              )}
            </View>
          </BlurView>
        </View>
      </Modal>
    </>
  )
}
