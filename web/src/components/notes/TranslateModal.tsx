"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Languages, Loader2, Globe, Check } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface TranslateModalProps {
    noteId: string;
    isOpen: boolean;
    onClose: () => void;
    currentLanguage?: LanguageCode | 'en';
    availableTranslations?: LanguageCode[];
}

export function TranslateModal({
    noteId,
    isOpen,
    onClose,
    currentLanguage = 'en',
    availableTranslations = [],
}: TranslateModalProps) {
    const router = useRouter();
    const { loading, generateTranslation } = useTranslations();
    const [generatingLanguage, setGeneratingLanguage] = useState<LanguageCode | null>(null);
    const [translatedLanguages, setTranslatedLanguages] = useState<Set<LanguageCode>>(
        new Set(availableTranslations)
    );

    const handleLanguageSelect = async (language: LanguageCode | 'en') => {
        if (language === 'en') {
            router.push(`/notes/${noteId}`);
            onClose();
            return;
        }

        // Check if translation exists
        if (!translatedLanguages.has(language)) {
            // Generate translation
            setGeneratingLanguage(language);
            const loadingToast = toast.loading(`Translating to ${SUPPORTED_LANGUAGES[language]}...`, {
                position: 'top-center',
            });

            try {
                // Add timeout to prevent infinite loading (3 minutes for translation)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

                const response = await fetch(`/api/notes/${noteId}/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Translation failed');
                }

                const data = await response.json();
                toast.dismiss(loadingToast);

                if (data.success) {
                    setTranslatedLanguages(prev => new Set([...prev, language]));
                    toast.success(`Translation to ${SUPPORTED_LANGUAGES[language]} complete!`);
                    router.push(`/notes/${noteId}?lang=${language}`);
                    onClose();
                } else {
                    throw new Error(data.error || 'Translation failed');
                }
            } catch (error) {
                toast.dismiss(loadingToast);
                console.error('Error generating translation:', error);
                if (error instanceof Error && error.name === 'AbortError') {
                    toast.error('Translation timed out. Please try again.');
                } else {
                    toast.error(error instanceof Error ? error.message : 'Failed to generate translation');
                }
            } finally {
                setGeneratingLanguage(null);
            }
        } else {
            // Translation exists, navigate to it
            router.push(`/notes/${noteId}?lang=${language}`);
            onClose();
        }
    };

    const getLanguageFlag = (lang: LanguageCode | 'en') => {
        const flags: Record<LanguageCode | 'en', string> = {
            en: '🇬🇧',
            es: '🇪🇸',
            fr: '🇫🇷',
            de: '🇩🇪',
            zh: '🇨🇳',
            hi: '🇮🇳',
        };
        return flags[lang];
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Translate Note
                    </DialogTitle>
                    <DialogDescription>
                        Select a language to translate this note into
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {/* Original English */}
                    <button
                        onClick={() => handleLanguageSelect('en')}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors border border-border"
                        disabled={loading}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{getLanguageFlag('en')}</span>
                            <div className="text-left">
                                <div className="font-medium">English</div>
                                <Badge variant="secondary" className="text-xs mt-1">Original</Badge>
                            </div>
                        </div>
                        {currentLanguage === 'en' && <Check className="h-5 w-5 text-primary" />}
                    </button>

                    <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-muted-foreground mb-2 px-1">Available Translations</p>
                        {(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((lang) => {
                            const isTranslated = translatedLanguages.has(lang);
                            const isGenerating = generatingLanguage === lang;
                            const isSelected = currentLanguage === lang;

                            return (
                                <button
                                    key={lang}
                                    onClick={() => handleLanguageSelect(lang)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors border border-border mb-2"
                                    disabled={isGenerating || loading}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{getLanguageFlag(lang)}</span>
                                        <div className="text-left">
                                            <div className="font-medium">{SUPPORTED_LANGUAGES[lang]}</div>
                                            {!isTranslated && (
                                                <Badge variant="outline" className="text-xs mt-1">
                                                    Click to Generate
                                                </Badge>
                                            )}
                                            {isGenerating && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                                    <span className="text-xs text-muted-foreground">Translating...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
