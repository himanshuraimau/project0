import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import {
    SUPPORTED_LANGUAGES,
    type LanguageCode,
    getOrCreateTranslation,
    checkTranslationAvailability,
} from '@/lib/api/translation';
import { useTheme } from '@/lib/hooks/useTheme';

interface TranslationModalProps {
    visible: boolean;
    onClose: () => void;
    noteId: string;
    currentLanguage: string;
    onLanguageSelect: (language: string) => void;
}

export default function TranslationModal({
    visible,
    onClose,
    noteId,
    currentLanguage,
    onLanguageSelect,
}: TranslationModalProps) {
    const { t } = useTranslation();
    const { theme, mode } = useTheme();
    const c = theme.colors;
    const isDark = mode === 'dark';
    const [loadingLanguage, setLoadingLanguage] = useState<string | null>(null);
    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check translation availability when modal opens
    useEffect(() => {
        if (visible) {
            checkAvailability();
        }
    }, [visible, noteId]);

    const checkAvailability = async () => {
        try {
            setCheckingAvailability(true);
            setError(null);
            const result = await checkTranslationAvailability(noteId);
            setAvailability(result);
        } catch (err: any) {
            console.error('Failed to check translation availability:', err);
            setError(err.message || 'Failed to check available translations');
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleTranslate = async (languageCode: LanguageCode) => {
        try {
            setLoadingLanguage(languageCode);
            setError(null);

            console.log(`Translating note ${noteId} to ${languageCode}...`);

            // Get or create translation
            await getOrCreateTranslation(noteId, languageCode);

            console.log(`Translation complete for ${languageCode}`);

            // Update availability
            setAvailability(prev => ({ ...prev, [languageCode]: true }));

            // Notify parent of language selection (note-only, not app-wide)
            onLanguageSelect(languageCode);

            // Close modal after a short delay
            setTimeout(() => {
                onClose();
            }, 500);
        } catch (err: any) {
            console.error('Translation failed:', err);
            setError(err.message || 'Failed to translate note');
        } finally {
            setLoadingLanguage(null);
        }
    };

    const handleLanguageSelect = async (languageCode: LanguageCode) => {
        // If already available or English, just switch to it
        if (availability[languageCode] || languageCode === 'en') {
            onLanguageSelect(languageCode);
            onClose();
        } else {
            // Generate translation
            await handleTranslate(languageCode);
        }
    };

    const availableLanguages = Object.keys(SUPPORTED_LANGUAGES).filter(
        lang => lang !== 'en'
    ) as LanguageCode[];

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
        },
        modalContainer: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: 'hidden',
            borderTopWidth: 0.5,
            borderLeftWidth: 0.5,
            borderRightWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            maxHeight: '80%',
        },
        glassOverlay: {
            backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.88)',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: 40,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : c.border,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '500',
            color: c.foreground,
        },
        closeButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : c.muted,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2',
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 20,
            marginTop: 16,
            borderRadius: 8,
            gap: 8,
        },
        errorText: {
            flex: 1,
            fontSize: 14,
            color: c.destructive,
            fontWeight: '500',
        },
        loadingContainer: {
            paddingVertical: 60,
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadingText: {
            marginTop: 12,
            fontSize: 14,
            color: c.mutedForeground,
        },
        languageList: {
            paddingHorizontal: 20,
            paddingTop: 16,
        },
        languageItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.muted,
            borderRadius: 12,
            marginBottom: 12,
            borderWidth: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        },
        languageItemActive: {
            backgroundColor: isDark ? 'rgba(130,100,255,0.15)' : c.accent,
            borderColor: c.primary,
            borderWidth: 1.5,
        },
        languageInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            gap: 12,
        },
        languageFlag: {
            fontSize: 32,
        },
        languageTextContainer: {
            flex: 1,
        },
        languageName: {
            fontSize: 16,
            fontWeight: '600',
            color: c.foreground,
            marginBottom: 2,
        },
        languageSubtext: {
            fontSize: 13,
            color: c.mutedForeground,
        },
        infoContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingHorizontal: 20,
            paddingTop: 16,
            gap: 8,
        },
        infoText: {
            flex: 1,
            fontSize: 12,
            color: c.mutedForeground,
            lineHeight: 18,
        },
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={styles.modalContainer}>
                    <View style={styles.glassOverlay}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('translation.selectLanguage')}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={20} color={c.mutedForeground} />
                            </TouchableOpacity>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorBanner}>
                                <Feather name="alert-circle" size={16} color={c.destructive} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Loading State */}
                        {checkingAvailability ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={c.primary} />
                                <Text style={styles.loadingText}>{t('common.loading')}</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.languageList}>
                                {/* English (Original) */}
                                <TouchableOpacity
                                    style={[
                                        styles.languageItem,
                                        currentLanguage === 'en' && styles.languageItemActive,
                                    ]}
                                    onPress={() => handleLanguageSelect('en')}
                                >
                                    <View style={styles.languageInfo}>
                                        <Text style={styles.languageFlag}>🇬🇧</Text>
                                        <View style={styles.languageTextContainer}>
                                            <Text style={styles.languageName}>
                                                {SUPPORTED_LANGUAGES.en}
                                            </Text>
                                            <Text style={styles.languageSubtext}>
                                                {t('translation.original')}
                                            </Text>
                                        </View>
                                    </View>
                                    {currentLanguage === 'en' && (
                                        <Feather name="check" size={20} color={c.primary} />
                                    )}
                                </TouchableOpacity>

                                {/* Other Languages */}
                                {availableLanguages.map((lang) => {
                                    const isAvailable = availability[lang];
                                    const isLoading = loadingLanguage === lang;
                                    const isActive = currentLanguage === lang;

                                    return (
                                        <TouchableOpacity
                                            key={lang}
                                            style={[
                                                styles.languageItem,
                                                isActive && styles.languageItemActive,
                                            ]}
                                            onPress={() => handleLanguageSelect(lang)}
                                            disabled={isLoading}
                                        >
                                            <View style={styles.languageInfo}>
                                                <Text style={styles.languageFlag}>
                                                    {getLanguageFlag(lang)}
                                                </Text>
                                                <View style={styles.languageTextContainer}>
                                                    <Text style={styles.languageName}>
                                                        {SUPPORTED_LANGUAGES[lang]}
                                                    </Text>
                                                    <Text style={styles.languageSubtext}>
                                                        {isAvailable
                                                            ? t('translation.available')
                                                            : t('translation.tapToTranslate')}
                                                    </Text>
                                                </View>
                                            </View>

                                            {isLoading ? (
                                                <ActivityIndicator size="small" color={c.primary} />
                                            ) : isActive ? (
                                                <Feather name="check" size={20} color={c.primary} />
                                            ) : isAvailable ? (
                                                <Feather name="check-circle" size={20} color={c.success} />
                                            ) : (
                                                <Feather name="download" size={20} color={c.mutedForeground} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Info Text */}
                        <View style={styles.infoContainer}>
                            <Feather name="info" size={14} color={c.mutedForeground} />
                            <Text style={styles.infoText}>
                                {t('translation.translationInfo')}
                            </Text>
                        </View>
                    </View>
                </BlurView>
            </View>
        </Modal>
    );
}

// Helper function to get flag emoji for language
function getLanguageFlag(lang: LanguageCode): string {
    const flags: Record<string, string> = {
        en: '🇬🇧',
        es: '🇪🇸',
        fr: '🇫🇷',
        de: '🇩🇪',
        zh: '🇨🇳',
        hi: '🇮🇳',
        pt: '🇵🇹',
        ja: '🇯🇵',
        ko: '🇰🇷',
        ar: '🇸🇦',
        ru: '🇷🇺',
        it: '🇮🇹',
        nl: '🇳🇱',
        tr: '🇹🇷',
        id: '🇮🇩',
        bn: '🇧🇩',
        vi: '🇻🇳',
        ta: '🇮🇳',
        ur: '🇵🇰',
        fa: '🇮🇷',
        th: '🇹🇭',
        pl: '🇵🇱',
        uk: '🇺🇦',
        sw: '🇰🇪',
        ro: '🇷🇴',
        el: '🇬🇷',
        he: '🇮🇱',
        cs: '🇨🇿',
        sv: '🇸🇪',
        hu: '🇭🇺',
    };
    return flags[lang] || '🌐';
}
