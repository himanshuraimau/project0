"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const themeOptions = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Auto", icon: Monitor },
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

  return (
    <div 
      className="bg-[#F9FAFB] dark:bg-[#1A1A1A] rounded-[14px] border border-black dark:border-neutral-700 p-8 h-[380px]"
      style={{
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <h2 className="text-[16px] font-normal text-[#0F172B] dark:text-white mb-12">
        Preferences
      </h2>

      {/* Theme Selection */}
      <div className="mb-7">
        <Label className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 mb-[26px] block">
          Theme
        </Label>
        <div className="flex gap-[22px]">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = mounted && theme === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={`flex items-center justify-center gap-2 px-[17.6px] h-[59px] rounded-[10px] transition-all ${
                  isSelected
                    ? "border-[1.6px] border-[#AD46FF] bg-[#FAF5FF] dark:bg-purple-900/20 text-[#0F172B] dark:text-purple-400"
                    : "border-[1.6px] border-[#E2E8F0] dark:border-neutral-700 bg-transparent dark:bg-neutral-900 text-[#0F172B] dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600"
                }`}
                style={{
                  width: option.id === 'light' ? '139px' : option.id === 'dark' ? '118px' : '121px'
                }}
              >
                <Icon className="w-5 h-5" strokeWidth={1.67} style={{ color: '#45556C' }} />
                <span className="text-[16px] font-normal leading-6">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-[rgba(0,0,0,0.1)] dark:bg-neutral-700 mb-6"></div>

      {/* Language Selection */}
      <div>
        <Label htmlFor="language" className="text-[14px] font-normal text-[#0A0A0A] dark:text-neutral-300 mb-[26px] block">
          Language
        </Label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger 
            id="language"
            className="w-full bg-[#F3F3F5] dark:bg-neutral-900 border-0 dark:border-neutral-700 rounded-[8px] h-[36px] text-[14px] text-[#0A0A0A] dark:text-neutral-300"
          >
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
