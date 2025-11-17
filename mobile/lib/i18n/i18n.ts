import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Import translation files
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import es from '@/locales/es.json'

const LANGUAGE_STORAGE_KEY = '@jellinote_language'

// Available languages
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
}

// Translation resources
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  es: { translation: es },
}

/**
 * Get device language
 * Extracts the language code from device locale (e.g., 'en-US' -> 'en')
 * Falls back to English if device language is not supported
 */
const getDeviceLanguage = (): string => {
  try {
    const deviceLocales = Localization.getLocales()
    if (deviceLocales && deviceLocales.length > 0) {
      const primaryLocale = deviceLocales[0]
      const languageCode = primaryLocale.languageCode || 'en'
      
      // Check if device language is supported
      return Object.keys(LANGUAGES).includes(languageCode) ? languageCode : 'en'
    }
  } catch (error) {
    console.error('Error getting device language:', error)
  }
  
  return 'en'
}

/**
 * Load stored language preference from AsyncStorage
 * Falls back to device language or English if no preference is stored
 */
export const loadStoredLanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (storedLanguage && Object.keys(LANGUAGES).includes(storedLanguage)) {
      console.log('📱 Loaded stored language:', storedLanguage)
      return storedLanguage
    }
  } catch (error) {
    console.error('❌ Error loading stored language:', error)
  }
  
  // Fallback to device language or English
  const deviceLang = getDeviceLanguage()
  console.log('📱 Using device language:', deviceLang)
  return deviceLang
}

/**
 * Save language preference and change i18n language
 * @param languageCode - The language code to set (e.g., 'en', 'hi', 'es')
 */
export const setLanguage = async (languageCode: string): Promise<void> => {
  try {
    if (!Object.keys(LANGUAGES).includes(languageCode)) {
      throw new Error(`Unsupported language: ${languageCode}`)
    }
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode)
    
    // Change i18n language
    await i18n.changeLanguage(languageCode)
    
    console.log(`✅ Language changed to: ${languageCode}`)
  } catch (error) {
    console.error('❌ Error setting language:', error)
    throw error
  }
}

/**
 * Get current language code
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en'
}

/**
 * Initialize i18next
 * Should be called once when the app starts
 */
export const initI18n = async (): Promise<void> => {
  try {
    const storedLanguage = await loadStoredLanguage()
    
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: storedLanguage,
        fallbackLng: 'en',
        compatibilityJSON: 'v4', // Important for Android compatibility
        interpolation: {
          escapeValue: false, // React already escapes values
        },
        react: {
          useSuspense: false, // Disable suspense for React Native
        },
      })
    
    console.log('✅ i18n initialized successfully with language:', storedLanguage)
  } catch (error) {
    console.error('❌ Error initializing i18n:', error)
    throw error
  }
}

export default i18n
