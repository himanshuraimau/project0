"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sun01Icon,
  Moon01Icon,
  TimeSetting01Icon,
  AccountSetting01Icon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const themeOptions = [
  { id: "light", label: "Light", icon: Sun01Icon },
  { id: "dark", label: "Dark", icon: Moon01Icon },
  { id: "system", label: "Auto", icon: TimeSetting01Icon },
];

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
];

export function PreferencesCard() {
  const { theme, setTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : undefined;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/80 bg-muted/20">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={AccountSetting01Icon} className="size-5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Preferences
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Theme */}
        <div className="space-y-3">
          <Label className="text-foreground text-lg">Theme</Label>
          <div className="flex flex-wrap gap-3">
            {themeOptions.map((option) => {
              const isSelected = currentTheme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    "flex min-w-0 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={option.icon}
                    className={cn(
                      "size-5 shrink-0",
                      isSelected && "text-primary"
                    )}
                  />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border/80" />

        {/* Language */}
        <div className="space-y-3">
          <Label htmlFor="prefs-language" className="text-foreground text-lg">
            Language
          </Label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger
              id="prefs-language"
              className="w-full h-11 cursor-pointer rounded-xl border-border bg-muted/30 focus:ring-primary/30"
            >
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl">
              {languages.map((lang) => (
                <SelectItem
                  key={lang.code}
                  value={lang.code}
                  className="rounded-lg cursor-pointer"
                >
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
