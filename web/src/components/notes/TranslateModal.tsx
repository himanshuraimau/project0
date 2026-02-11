"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/hooks/use-translations";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LanguageSquareIcon,
  Loading01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";

interface TranslateModalProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: LanguageCode | "en";
  availableTranslations?: LanguageCode[];
}

export function TranslateModal({
  noteId,
  isOpen,
  onClose,
  currentLanguage = "en",
  availableTranslations = [],
}: TranslateModalProps) {
  const router = useRouter();
  const { loading } = useTranslations();
  const [generatingLanguage, setGeneratingLanguage] =
    useState<LanguageCode | null>(null);
  const [translatedLanguages, setTranslatedLanguages] = useState<
    Set<LanguageCode>
  >(new Set(availableTranslations));

  const handleLanguageSelect = async (language: LanguageCode | "en") => {
    if (language === "en") {
      router.push(`/notes/${noteId}`);
      onClose();
      return;
    }

    // Check if translation exists
    if (!translatedLanguages.has(language)) {
      setGeneratingLanguage(language);
      const loadingToast = toast.loading(
        `Translating to ${SUPPORTED_LANGUAGES[language]}…`,
        {
          position: "top-center",
        },
      );

      try {
        // Timeout safeguard (3 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);

        const response = await fetch(`/api/notes/${noteId}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Translation failed");
        }

        const data = await response.json();
        toast.dismiss(loadingToast);

        if (data.success) {
          setTranslatedLanguages((prev) => new Set([...prev, language]));
          toast.success(
            `Translation to ${SUPPORTED_LANGUAGES[language]} is ready.`,
          );
          router.push(`/notes/${noteId}?lang=${language}`);
          onClose();
        } else {
          throw new Error(data.error || "Translation failed");
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error("Error generating translation:", error);
        if (error instanceof Error && error.name === "AbortError") {
          toast.error("Translation timed out. Please try again.");
        } else {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to generate translation",
          );
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

  const getLanguageFlag = (lang: LanguageCode | "en") => {
    const flags: Record<LanguageCode | "en", string> = {
      en: "🇬🇧",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      zh: "🇨🇳",
      hi: "🇮🇳",
    };
    return flags[lang];
  };

  const languages = Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-border bg-card">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={LanguageSquareIcon} className="size-4" />
            </div>
            <span>Translate this note</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate high‑quality translations and switch between languages
            without losing your original.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3 max-h-[420px] overflow-y-auto">
          {/* Original English */}
          <button
            onClick={() => handleLanguageSelect("en")}
            className="w-full flex items-center justify-between rounded-lg border border-border/50 bg-muted/60 px-3.5 py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
            disabled={loading}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getLanguageFlag("en")}</span>
              <div className="text-left">
                <div className="text-sm font-medium text-foreground">
                  English
                </div>
                <Badge
                  variant="secondary"
                  className="mt-1 h-5 rounded-full px-2 text-[10px] font-medium"
                >
                  Original language
                </Badge>
              </div>
            </div>
            {currentLanguage === "en" && (
              <HugeiconsIcon
                icon={Tick01Icon}
                className="size-4 text-primary"
              />
            )}
          </button>

          <div className="pt-3">
            <p className="mb-2 px-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Available translations
            </p>
            <div className="space-y-2">
              {languages.map((lang) => {
                const isTranslated = translatedLanguages.has(lang);
                const isGenerating = generatingLanguage === lang;
                const isSelected = currentLanguage === lang;

                return (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className="w-full flex items-center justify-between rounded-lg border border-border/50  px-3.5 py-3 text-left transition-colors bg-muted/60 cursor-pointer disabled:opacity-60"
                    disabled={isGenerating || loading}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getLanguageFlag(lang)}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-foreground">
                          {SUPPORTED_LANGUAGES[lang]}
                        </div>
                        {!isTranslated && !isGenerating && (
                          <Badge
                            variant="outline"
                            className="mt-1 h-5 rounded-full px-2 text-[10px] font-medium"
                          >
                            Click to generate
                          </Badge>
                        )}
                        {isTranslated && !isGenerating && (
                          <span className="mt-1 inline-block text-[11px] text-muted-foreground">
                            Ready · tap to view
                          </span>
                        )}
                        {isGenerating && (
                          <div className="mt-1 flex items-center gap-1">
                            <HugeiconsIcon
                              icon={Loading01Icon}
                              className="size-3.5 animate-spin text-primary"
                            />
                            <span className="text-[11px] text-muted-foreground">
                              Translating…
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <HugeiconsIcon
                        icon={Tick01Icon}
                        className="size-4 text-primary"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
