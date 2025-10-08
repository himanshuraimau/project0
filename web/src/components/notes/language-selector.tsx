"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Languages, Loader2, Globe, Check } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/types';
import { toast } from 'sonner';

interface LanguageSelectorProps {
  noteId: string;
  currentLanguage: LanguageCode | 'en';
  onLanguageChange: (language: LanguageCode | 'en') => void;
  availableTranslations?: LanguageCode[];
}

export function LanguageSelector({
  noteId,
  currentLanguage,
  onLanguageChange,
  availableTranslations = [],
}: LanguageSelectorProps) {
  const { loading, generateTranslation } = useTranslations();
  const [generatingLanguage, setGeneratingLanguage] = useState<LanguageCode | null>(null);
  const [translatedLanguages, setTranslatedLanguages] = useState<Set<LanguageCode>>(
    new Set(availableTranslations)
  );

  console.log('LanguageSelector rendered:', { noteId, currentLanguage, availableTranslations });

  useEffect(() => {
    setTranslatedLanguages(new Set(availableTranslations));
  }, [availableTranslations]);

  const handleLanguageSelect = async (language: LanguageCode | 'en') => {
    if (language === 'en') {
      onLanguageChange('en');
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
        const translation = await generateTranslation(noteId, language);
        toast.dismiss(loadingToast);

        if (translation) {
          setTranslatedLanguages(prev => new Set([...prev, language]));
          onLanguageChange(language);
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Error generating translation:', error);
      } finally {
        setGeneratingLanguage(null);
      }
    } else {
      // Translation exists, just switch to it
      onLanguageChange(language);
    }
  };

  const getLanguageLabel = (lang: LanguageCode | 'en') => {
    if (lang === 'en') return 'English';
    return SUPPORTED_LANGUAGES[lang];
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl px-3 py-2 hover:bg-primary/5 border-border hover:border-primary/20 transition-all duration-200 flex items-center gap-2"
          disabled={loading}
          title="Translate note to other languages"
        >
          {loading && generatingLanguage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Translating...</span>
            </>
          ) : (
            <>
              <Languages className="h-4 w-4" />
              <span className="text-sm font-medium">{getLanguageFlag(currentLanguage)} {getLanguageLabel(currentLanguage)}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Select Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Original English */}
        <DropdownMenuItem
          onClick={() => handleLanguageSelect('en')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span>{getLanguageFlag('en')}</span>
              <span>English</span>
              <Badge variant="secondary" className="text-xs">Original</Badge>
            </div>
            {currentLanguage === 'en' && <Check className="h-4 w-4 text-primary" />}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Translations
        </DropdownMenuLabel>

        {/* Supported Languages */}
        {(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((lang) => {
          const isTranslated = translatedLanguages.has(lang);
          const isGenerating = generatingLanguage === lang;
          const isSelected = currentLanguage === lang;

          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => handleLanguageSelect(lang)}
              className="cursor-pointer"
              disabled={isGenerating}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span>{getLanguageFlag(lang)}</span>
                  <span>{SUPPORTED_LANGUAGES[lang]}</span>
                  {!isTranslated && (
                    <Badge variant="outline" className="text-xs">
                      Generate
                    </Badge>
                  )}
                  {isGenerating && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
