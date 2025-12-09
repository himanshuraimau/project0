import React from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

interface LanguageSelectorProps {
  visible: boolean
  onClose: () => void
  onSelectLanguage: (languageCode: string) => void
  currentLanguage: string
  availableLanguages?: string[] // Languages that have translations for this note
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
]

export default function LanguageSelector({
  visible,
  onClose,
  onSelectLanguage,
  currentLanguage,
  availableLanguages,
}: LanguageSelectorProps) {
  const { t } = useTranslation()

  const handleSelectLanguage = (languageCode: string) => {
    onSelectLanguage(languageCode)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('note.selectLanguage')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            {t('note.selectLanguageDescription')}
          </Text>

          {/* Language Options */}
          <View style={styles.languageList}>
            {SUPPORTED_LANGUAGES.map((language) => {
              const isSelected = currentLanguage === language.code
              const hasTranslation = !availableLanguages || availableLanguages.includes(language.code) || language.code === 'en'
              
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    isSelected && styles.selectedLanguage,
                    !hasTranslation && styles.disabledLanguage,
                  ]}
                  onPress={() => hasTranslation && handleSelectLanguage(language.code)}
                  disabled={!hasTranslation}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.flag}>{language.flag}</Text>
                    <View style={styles.languageText}>
                      <Text style={[styles.languageName, !hasTranslation && styles.disabledText]}>
                        {language.name}
                      </Text>
                      <Text style={[styles.nativeName, !hasTranslation && styles.disabledText]}>
                        {language.nativeName}
                      </Text>
                    </View>
                  </View>
                  
                  {!hasTranslation && language.code !== 'en' && (
                    <Text style={styles.notAvailable}>{t('note.notTranslated')}</Text>
                  )}
                  
                  {isSelected && (
                    <Feather name="check" size={20} color="#00D3F3" />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Info Footer */}
          <View style={styles.footer}>
            <Feather name="info" size={16} color="#888888" />
            <Text style={styles.footerText}>
              {t('note.translationInfo')}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
    lineHeight: 20,
  },
  languageList: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedLanguage: {
    borderColor: '#00D3F3',
    backgroundColor: 'rgba(0, 211, 243, 0.1)',
  },
  disabledLanguage: {
    opacity: 0.5,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 12,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  nativeName: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  disabledText: {
    color: '#666666',
  },
  notAvailable: {
    fontSize: 12,
    color: '#888888',
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#888888',
    flex: 1,
    lineHeight: 16,
  },
})
