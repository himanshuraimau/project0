# 🌍 i18n Language Switching System

Complete internationalization (i18n) implementation for the Jellinote AI mobile app using i18next and react-i18next.

## 📦 Installed Packages

```bash
- i18next@25.6.2
- react-i18next@16.3.3
- expo-localization@17.0.7
- @react-native-async-storage/async-storage@2.2.0
- expo-clipboard@8.0.7
```

## 🗂️ File Structure

```
mobile/
├── locales/
│   ├── en.json         # English translations
│   ├── hi.json         # Hindi translations
│   └── es.json         # Spanish translations
├── lib/
│   └── i18n/
│       └── i18n.ts     # i18n configuration and utilities
├── components/
│   └── home/
│       └── settings/
│           ├── settings.tsx         # Settings screen (uses translations)
│           ├── accountInfo.tsx      # Account Info screen (uses translations)
│           └── changeLanguage.tsx   # Language selector screen
└── app/
    ├── _layout.tsx     # Root layout with i18n initialization
    └── (drawer)/
        └── (home)/
            ├── settings.tsx
            ├── accountInfo.tsx
            └── changeLanguage.tsx  # Route file
```

## 🚀 Features

### ✅ Implemented Features

1. **Automatic Device Language Detection**
   - Detects device language using `expo-localization`
   - Falls back to English if device language is not supported

2. **Persistent Language Preference**
   - Saves user's language choice to AsyncStorage
   - Loads saved language on app startup

3. **Runtime Language Switching**
   - Change language without restarting the app
   - Updates UI instantly across all screens

4. **Translation Coverage**
   - Settings screen
   - Account Info screen
   - Language selector screen
   - Common UI elements

5. **Supported Languages**
   - 🇬🇧 English (en)
   - 🇮🇳 Hindi (hi)
   - 🇪🇸 Spanish (es)

## 📖 Usage in Components

### Basic Usage with `useTranslation` Hook

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t, i18n } = useTranslation()
  
  return (
    <View>
      <Text>{t('common.jellinote')}</Text>
      <Text>{t('settings.accountInfo')}</Text>
      <Text>Current language: {i18n.language}</Text>
    </View>
  )
}
```

### String Interpolation

```tsx
// In translation file:
{
  "welcome": "Welcome, {{name}}!"
}

// In component:
<Text>{t('welcome', { name: 'John' })}</Text>
// Output: "Welcome, John!"
```

### Pluralization

```tsx
// In translation file:
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// In component:
<Text>{t('items', { count: 1 })}</Text>  // "1 item"
<Text>{t('items', { count: 5 })}</Text>  // "5 items"
```

### Conditional Translation

```tsx
const { t } = useTranslation()

const message = someCondition 
  ? t('settings.logout') 
  : t('settings.accountInfo')
```

## 🔧 i18n Utility Functions

### Change Language Programmatically

```tsx
import { setLanguage } from '@/lib/i18n/i18n'

// Change to Hindi
await setLanguage('hi')

// Change to Spanish
await setLanguage('es')
```

### Get Current Language

```tsx
import { getCurrentLanguage } from '@/lib/i18n/i18n'

const currentLang = getCurrentLanguage()
console.log('Current language:', currentLang) // 'en', 'hi', or 'es'
```

### Get Available Languages

```tsx
import { LANGUAGES } from '@/lib/i18n/i18n'

Object.entries(LANGUAGES).map(([code, { name, nativeName, flag }]) => {
  console.log(`${flag} ${code}: ${name} (${nativeName})`)
})
```

## 📝 Adding New Translations

### 1. Add to Translation Files

**locales/en.json:**
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my new feature",
    "button": "Click me"
  }
}
```

**locales/hi.json:**
```json
{
  "myFeature": {
    "title": "मेरी सुविधा",
    "description": "यह मेरी नई सुविधा है",
    "button": "मुझे क्लिक करें"
  }
}
```

**locales/es.json:**
```json
{
  "myFeature": {
    "title": "Mi función",
    "description": "Esta es mi nueva función",
    "button": "Haz clic en mí"
  }
}
```

### 2. Use in Components

```tsx
function MyFeature() {
  const { t } = useTranslation()
  
  return (
    <View>
      <Text>{t('myFeature.title')}</Text>
      <Text>{t('myFeature.description')}</Text>
      <Button title={t('myFeature.button')} />
    </View>
  )
}
```

## 🌐 Adding a New Language

### 1. Create Translation File

Create `mobile/locales/fr.json` for French:

```json
{
  "common": {
    "jellinote": "Jellinote AI",
    "back": "Retour",
    ...
  },
  ...
}
```

### 2. Update i18n Configuration

**mobile/lib/i18n/i18n.ts:**

```tsx
// Import the new translation
import fr from '@/locales/fr.json'

// Add to LANGUAGES object
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' }, // NEW
}

// Add to resources object
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  es: { translation: es },
  fr: { translation: fr }, // NEW
}
```

### 3. Add to Translation Files

Update all existing translation files to include the new language name:

**locales/en.json, hi.json, es.json:**
```json
{
  "languages": {
    ...
    "fr": "Français (French)"
  }
}
```

## 🔍 Testing Language Switching

### 1. Via Language Selector Screen
1. Open Settings
2. Tap "Change Language"
3. Select a language
4. Observe instant UI update

### 2. Programmatically
```tsx
import { setLanguage } from '@/lib/i18n/i18n'

// In a component or handler
const handleTestLanguage = async () => {
  await setLanguage('hi') // Switch to Hindi
}
```

### 3. Check Device Language Detection
```tsx
import * as Localization from 'expo-localization'

const deviceLocales = Localization.getLocales()
console.log('Device language:', deviceLocales[0].languageCode)
```

## 🎨 Date and Number Formatting (Optional Enhancement)

### Date Formatting

```tsx
import { useTranslation } from 'react-i18next'

function DateDisplay({ date }: { date: Date }) {
  const { i18n } = useTranslation()
  
  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
  
  return <Text>{formattedDate}</Text>
}
```

### Number Formatting

```tsx
function PriceDisplay({ amount }: { amount: number }) {
  const { i18n } = useTranslation()
  
  const formattedPrice = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
  
  return <Text>{formattedPrice}</Text>
}
```

## 🔄 RTL Language Support (Arabic, Hebrew)

### Adding RTL Language

**locales/ar.json:**
```json
{
  "common": {
    "jellinote": "جيلينوت AI",
    ...
  }
}
```

### Enable RTL in Component

```tsx
import { I18nManager } from 'react-native'
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { i18n } = useTranslation()
  
  useEffect(() => {
    const isRTL = i18n.language === 'ar' || i18n.language === 'he'
    I18nManager.forceRTL(isRTL)
    // Note: App restart required for RTL changes
  }, [i18n.language])
}
```

## 🐛 Troubleshooting

### Issue: Translations not showing

**Solution:**
1. Check if i18n is initialized in `_layout.tsx`
2. Verify translation key exists in JSON files
3. Check console for initialization errors

### Issue: Language not persisting

**Solution:**
1. Verify AsyncStorage permissions
2. Check if `setLanguage()` is called correctly
3. Clear app storage and try again:
   ```bash
   npx expo start --clear
   ```

### Issue: "Missing translation" warning

**Solution:**
1. Add the missing key to all translation files
2. Or use a default value:
   ```tsx
   t('missing.key', 'Default text')
   ```

## 📊 Translation Coverage

Current translation coverage by screen:

- ✅ Settings screen: 100%
- ✅ Account Info screen: 100%
- ✅ Language selector screen: 100%
- ⏳ Other screens: Add as needed

## 🎯 Best Practices

1. **Keep Translation Keys Organized**
   - Use nested objects for related translations
   - Group by feature or screen

2. **Use Descriptive Keys**
   - ✅ `settings.accountInfo`
   - ❌ `s.ai`

3. **Avoid Hardcoded Strings**
   - Always use `t()` function
   - Never hardcode user-facing text

4. **Test All Languages**
   - Verify UI layout with longer text (German, Spanish)
   - Check RTL layout for Arabic/Hebrew

5. **Context Matters**
   - Same English word may need different translations in different contexts
   - Use separate keys when needed

## 📚 Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [expo-localization Documentation](https://docs.expo.dev/versions/latest/sdk/localization/)
- [React Native I18nManager](https://reactnative.dev/docs/i18nmanager)

## 🎉 You're All Set!

The language switching system is now fully implemented and ready to use. Users can:
- Switch languages from the Settings screen
- Have their preference saved automatically
- See translations update instantly across the app
- Benefit from automatic device language detection

Happy internationalizing! 🌍
