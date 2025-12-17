/**
 * Translation API Usage Examples
 * 
 * Import the translation module in your React Native components:
 */

import {
    getTranslation,
    translateNote,
    deleteTranslation,
    getOrCreateTranslation,
    translateNoteToMultipleLanguages,
    getAllTranslations,
    checkTranslationAvailability,
    SUPPORTED_LANGUAGES,
    getAvailableTranslationLanguages,
    isSupportedLanguage
} from '@/lib/api/translation';

// Or import the entire module:
// import translationApi from '@/lib/api/translation';
// Or from index:
// import { translationApi } from '@/lib/api';

// ==================== Example 1: Simple Translation ====================

async function example1_simpleTranslation(noteId: string) {
    try {
        // Translate to Spanish
        const translation = await translateNote(noteId, 'es');
        console.log('Title:', translation.title);
        console.log('Content:', translation.content);
    } catch (error) {
        console.error('Translation failed:', error);
    }
}

// ==================== Example 2: Fetch or Create ====================

async function example2_fetchOrCreate(noteId: string) {
    try {
        // Automatically fetches if exists, generates if not
        const translation = await getOrCreateTranslation(noteId, 'hi');
        console.log('Hindi translation:', translation.title);
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==================== Example 3: Multiple Languages ====================

async function example3_multipleLanguages(noteId: string) {
    const languages = ['es', 'fr', 'hi'];

    const result = await translateNoteToMultipleLanguages(noteId, languages);

    console.log(`✅ Successful: ${result.successful.length}`);
    result.successful.forEach(t => {
        console.log(`- ${t.language}: ${t.title}`);
    });

    console.log(`❌ Failed: ${result.failed.length}`);
    result.failed.forEach(f => {
        console.log(`- ${f.language}: ${f.error}`);
    });
}

// ==================== Example 4: Check Availability ====================

async function example4_checkAvailability(noteId: string) {
    const availability = await checkTranslationAvailability(noteId);

    Object.entries(availability).forEach(([lang, exists]) => {
        console.log(`${lang}: ${exists ? '✅' : '❌'}`);
    });
}

// ==================== Example 5: React Native Component ====================

import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';

export function TranslationExample({ noteId }: { noteId: string }) {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('es');
    const [translation, setTranslation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState<Record<string, boolean>>({});

    useEffect(() => {
        checkAvailability();
    }, [noteId]);

    const checkAvailability = async () => {
        const result = await checkTranslationAvailability(noteId);
        setAvailability(result);
    };

    const handleTranslate = async () => {
        setLoading(true);
        try {
            const result = await getOrCreateTranslation(noteId, selectedLanguage);
            setTranslation(result);
            await checkAvailability(); // Refresh availability
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!translation) return;

        try {
            await deleteTranslation(noteId, selectedLanguage);
            setTranslation(null);
            await checkAvailability(); // Refresh availability
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const availableLanguages = getAvailableTranslationLanguages();

    return (
        <ScrollView>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                Translation Manager
            </Text>

            {/* Language Selector */}
            <View style={{ marginBottom: 20 }}>
                {availableLanguages.map(lang => (
                    <Button
                        key={lang}
                        title={`${SUPPORTED_LANGUAGES[lang]} ${availability[lang] ? '✅' : ''}`}
                        onPress={() => setSelectedLanguage(lang)}
                        disabled={selectedLanguage === lang}
                    />
                ))}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <Button
                    title="Translate"
                    onPress={handleTranslate}
                    disabled={loading}
                />
                {translation && (
                    <Button
                        title="Delete"
                        onPress={handleDelete}
                        color="red"
                    />
                )}
            </View>

            {/* Loading State */}
            {loading && <ActivityIndicator size="large" />}

            {/* Translation Display */}
            {translation && !loading && (
                <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                        {translation.title}
                    </Text>
                    <Text style={{ marginTop: 10 }}>
                        {translation.content}
                    </Text>
                    <Text style={{ color: 'gray', marginTop: 10, fontSize: 12 }}>
                        Language: {SUPPORTED_LANGUAGES[translation.language as keyof typeof SUPPORTED_LANGUAGES]}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

// ==================== Example 6: Language Utilities ====================

function example6_languageUtilities() {
    // Get all supported languages
    console.log('All languages:', SUPPORTED_LANGUAGES);

    // Get available translation languages (excluding English)
    const translatable = getAvailableTranslationLanguages();
    console.log('Translatable to:', translatable); // ['es', 'fr', 'de', 'zh', 'hi']

    // Check if language is supported
    console.log(isSupportedLanguage('es')); // true
    console.log(isSupportedLanguage('ja')); // false
}

// ==================== Example 7: Error Handling ====================

async function example7_errorHandling(noteId: string) {
    try {
        // Try to get translation
        const translation = await getTranslation(noteId, 'es');
        console.log('Translation exists:', translation.title);
    } catch (error: any) {
        if (error.statusCode === 404) {
            console.log('Translation not found, creating...');
            const newTranslation = await translateNote(noteId, 'es');
            console.log('Created:', newTranslation.title);
        } else if (error.statusCode === 401) {
            console.log('Unauthorized - please login');
        } else {
            console.error('Error:', error.message);
        }
    }
}
