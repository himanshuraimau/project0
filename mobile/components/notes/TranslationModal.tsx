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
import { useTranslation } from 'react-i18next';
import {
    SUPPORTED_LANGUAGES,
    type LanguageCode,
    getOrCreateTranslation,
    checkTranslationAvailability,
} from '@/lib/api/translation';

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

            console.log(`📝 Translating note ${noteId} to ${languageCode}...`);

            // Get or create translation
            await getOrCreateTranslation(noteId, languageCode);

            console.log(`✅ Translation complete for ${languageCode}`);

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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('translation.selectLanguage')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorBanner}>
                            <Feather name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Loading State */}
                    {checkingAvailability ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#7C3AED" />
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
                                    <Feather name="check" size={20} color="#7C3AED" />
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
                                            <ActivityIndicator size="small" color="#7C3AED" />
                                        ) : isActive ? (
                                            <Feather name="check" size={20} color="#7C3AED" />
                                        ) : isAvailable ? (
                                            <Feather name="check-circle" size={20} color="#10B981" />
                                        ) : (
                                            <Feather name="download" size={20} color="#9CA3AF" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Info Text */}
                    <View style={styles.infoContainer}>
                        <Feather name="info" size={14} color="#6B7280" />
                        <Text style={styles.infoText}>
                            {t('translation.translationInfo')}
                        </Text>
                    </View>
                </View>
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

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
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
        color: '#EF4444',
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
        color: '#6B7280',
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
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    languageItemActive: {
        backgroundColor: '#F3E8FF',
        borderColor: '#7C3AED',
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
        color: '#111827',
        marginBottom: 2,
    },
    languageSubtext: {
        fontSize: 13,
        color: '#6B7280',
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
        color: '#6B7280',
        lineHeight: 18,
    },
});
