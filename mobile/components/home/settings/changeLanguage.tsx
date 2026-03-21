import React, { useState } from 'react'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/lib/hooks/useTheme'
import { LANGUAGES, setLanguage } from '@/lib/i18n/i18n'
import { translateAllNotes, TranslationProgress } from '@/lib/service/noteTranslation'
import {
  StatusBar,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAlert } from '@/lib/contexts/AlertContext'
import { neutral } from '@/lib/design-system'

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
  const { showAlert } = useAlert()

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language) return

    setIsChanging(true)
    setSelectedLanguage(languageCode)

    try {
      await setLanguage(languageCode)
      setShowTranslationModal(true)

      const result = await translateAllNotes(languageCode, (progress) => {
        setTranslationProgress(progress)
      })

      setShowTranslationModal(false)
      setTranslationProgress(null)

      setTimeout(() => {
        if (result.success) {
          if (result.failedCount === 0) {
            showAlert(
              t('language.translationComplete'),
              t('language.translationCompleteMessage', { count: result.translatedCount, total: result.totalNotes }),
              [{ text: t('common.ok'), onPress: () => router.back() }]
            )
          } else {
            showAlert(
              t('language.translationPartialSuccess'),
              t('language.translationPartialMessage', { success: result.translatedCount, failed: result.failedCount }),
              [{ text: t('common.ok'), onPress: () => router.back() }]
            )
          }
        } else {
          showAlert(
            t('language.languageChanged'),
            t('language.translationFailedMessage'),
            [{ text: t('common.ok'), onPress: () => router.back() }]
          )
        }
      }, 300)
    } catch (error) {
      setShowTranslationModal(false)
      setTranslationProgress(null)
      showAlert(t('common.error'), t('language.errorChanging'))
      setSelectedLanguage(i18n.language)
    } finally {
      setIsChanging(false)
    }
  }

  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const languages = Object.entries(LANGUAGES)

  return (
    <>
      <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safe} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Feather name="arrow-left" size={24} color={c.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>
              {t('language.title')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Current language card */}
            <View style={[styles.currentCard, { backgroundColor: isDark ? 'rgba(52,199,89,0.08)' : 'rgba(52,199,89,0.06)', borderColor: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.12)' }]}>
              <View style={[styles.currentIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
              </View>
              <View style={styles.currentInfo}>
                <Text style={[styles.currentLabel, { color: c.mutedForeground }]}>Current language</Text>
                <Text style={[styles.currentValue, { color: c.foreground }]}>
                  {LANGUAGES[i18n.language as keyof typeof LANGUAGES]?.flag}{' '}
                  {LANGUAGES[i18n.language as keyof typeof LANGUAGES]?.nativeName || i18n.language}
                </Text>
              </View>
            </View>

            {/* Languages list */}
            <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
              {t('language.available')}
            </Text>
            <View style={[styles.group, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {languages.map(([code, { name, nativeName, flag }], idx) => {
                const isSelected = selectedLanguage === code
                const isCurrent = i18n.language === code

                return (
                  <React.Fragment key={code}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.langRow,
                        { opacity: (isChanging && !isSelected) ? 0.5 : pressed ? 0.6 : 1 },
                      ]}
                      onPress={() => handleLanguageChange(code)}
                      disabled={isChanging}
                    >
                      {/* Flag */}
                      <Text style={styles.flag}>{flag}</Text>

                      {/* Names */}
                      <View style={styles.langInfo}>
                        <Text style={[styles.langName, { color: c.foreground }]}>
                          {nativeName}
                        </Text>
                        <Text style={[styles.langSub, { color: c.mutedForeground }]}>
                          {name}
                        </Text>
                      </View>

                      {/* Right side */}
                      {isChanging && isSelected ? (
                        <ActivityIndicator size="small" color={c.primary} />
                      ) : isCurrent ? (
                        <Ionicons name="checkmark" size={20} color={c.primary} />
                      ) : (
                        <View />
                      )}
                    </Pressable>
                    {idx < languages.length - 1 && (
                      <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                    )}
                  </React.Fragment>
                )
              })}
            </View>

            <Text style={[styles.footerHint, { color: c.mutedForeground }]}>
              Changing your language will translate all your existing notes automatically.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Translation Progress Modal */}
      <Modal visible={showTranslationModal} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? neutral[900] : '#fff' }]}>
            <View style={[styles.modalIcon, { backgroundColor: isDark ? 'rgba(79,59,231,0.12)' : 'rgba(79,59,231,0.06)' }]}>
              <Ionicons name="globe" size={32} color={c.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: c.foreground }]}>
              {t('language.translatingNotes')}
            </Text>

            <Text style={[styles.modalSub, { color: c.mutedForeground }]}>
              {translationProgress
                ? t('language.translationProgress', {
                    current: translationProgress.completed,
                    total: translationProgress.total,
                  })
                : t('common.loading')}
            </Text>

            {translationProgress?.currentNote && (
              <Text
                style={[styles.modalNote, { color: c.mutedForeground }]}
                numberOfLines={1}
              >
                {translationProgress.currentNote}
              </Text>
            )}

            {/* Progress bar */}
            {translationProgress && (
              <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: c.primary,
                      width: `${(translationProgress.completed / translationProgress.total) * 100}%`,
                    },
                  ]}
                />
              </View>
            )}

            <ActivityIndicator
              size="small"
              color={c.primary}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  currentIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentInfo: { flex: 1 },
  currentLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 0.1, marginBottom: 2 },
  currentValue: { fontSize: 16, fontWeight: '600' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  flag: { fontSize: 26 },
  langInfo: { flex: 1 },
  langName: { fontSize: 16, fontWeight: '600', marginBottom: 1 },
  langSub: { fontSize: 13 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 52 },

  footerHint: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 4,
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalSheet: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 8 },
  modalSub: { fontSize: 15, fontWeight: '500', textAlign: 'center', marginBottom: 4 },
  modalNote: { fontSize: 13, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 12 },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 18,
  },
  progressFill: { height: '100%', borderRadius: 3 },
})
