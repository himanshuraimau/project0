"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PodcastConfig } from "@/lib/types/podcast.types";
import { VoiceSelectionInterface } from "./voice-selection-interface";

// Form validation schema - same as modal
const podcastConfigSchema = z.object({
  language: z.string().min(1, "Language is required"),
  durationPreset: z.enum(["short", "medium", "long"]),
  host1VoiceId: z.string().min(1, "Host 1 voice is required"),
  host1VoiceName: z.string().min(1, "Host 1 voice name is required"),
  host2VoiceId: z.string().min(1, "Host 2 voice is required"),
  host2VoiceName: z.string().min(1, "Host 2 voice name is required"),
  customInstructions: z.string().optional(),
});

type FormData = z.infer<typeof podcastConfigSchema>;

interface PodcastConfigurationInlineProps {
  noteId: string;
  onGenerate: (config: PodcastConfig) => void;
  loading?: boolean;
}

// Language options
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
];

// Duration presets
const DURATION_PRESETS = [
  {
    value: "short",
    label: "Short",
    duration: "3-7 minutes",
    description: "Quick overview with key points",
    wordCount: "400-800 words",
  },
  {
    value: "medium",
    label: "Medium",
    duration: "8-15 minutes",
    description: "Detailed discussion with examples",
    wordCount: "1000-2000 words",
  },
  {
    value: "long",
    label: "Long",
    duration: "16-30 minutes",
    description: "Comprehensive deep-dive conversation",
    wordCount: "2500-4000 words",
  },
];

// Custom instruction templates
const INSTRUCTION_TEMPLATES = [
  {
    label: "Educational",
    value: "Focus on explaining concepts clearly with examples. Use a teaching tone and include practical applications.",
  },
  {
    label: "Conversational",
    value: "Keep the discussion casual and engaging. Include personal anecdotes and relatable examples.",
  },
  {
    label: "Professional",
    value: "Maintain a formal, business-oriented tone. Focus on practical insights and actionable takeaways.",
  },
  {
    label: "Storytelling",
    value: "Present information through narratives and stories. Make it engaging and memorable.",
  },
];

export function PodcastConfigurationInline({
  noteId,
  onGenerate,
  loading = false,
}: PodcastConfigurationInlineProps) {
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(podcastConfigSchema),
    defaultValues: {
      language: "en",
      durationPreset: "medium",
      host1VoiceId: "",
      host1VoiceName: "",
      host2VoiceId: "",
      host2VoiceName: "",
      customInstructions: "",
    },
  });

  const watchedLanguage = form.watch("language");
  const watchedHost1Voice = form.watch("host1VoiceId");
  const watchedHost2Voice = form.watch("host2VoiceId");

  // Clear voice selections when language changes
  useEffect(() => {
    form.setValue("host1VoiceId", "");
    form.setValue("host1VoiceName", "");
    form.setValue("host2VoiceId", "");
    form.setValue("host2VoiceName", "");
  }, [watchedLanguage, form]);

  const handleVoiceSelect = (
    voiceId: string,
    voiceName: string,
    hostNumber: 1 | 2
  ) => {
    if (hostNumber === 1) {
      form.setValue("host1VoiceId", voiceId);
      form.setValue("host1VoiceName", voiceName);
    } else {
      form.setValue("host2VoiceId", voiceId);
      form.setValue("host2VoiceName", voiceName);
    }
    setVoiceError(null);
  };

  const onSubmit = async (data: FormData) => {
    // Validate voices are different
    if (data.host1VoiceId === data.host2VoiceId) {
      setVoiceError("Please select different voices for Host 1 and Host 2");
      return;
    }

    const config: PodcastConfig = {
      language: data.language,
      durationPreset: data.durationPreset,
      host1VoiceId: data.host1VoiceId,
      host1VoiceName: data.host1VoiceName,
      host2VoiceId: data.host2VoiceId,
      host2VoiceName: data.host2VoiceName,
      customInstructions: data.customInstructions,
    };

    onGenerate(config);
  };

  const handleTemplateSelect = (template: string) => {
    form.setValue("customInstructions", template);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Language Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Language</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value} className="cursor-pointer flex items-center gap-2">
                              <span className="text-lg">{option.flag}</span>
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Duration Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Podcast Length</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="durationPreset"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        {DURATION_PRESETS.map((preset) => (
                          <div key={preset.value} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                            <RadioGroupItem value={preset.value} id={preset.value} className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor={preset.value} className="cursor-pointer">
                                <div className="font-medium">{preset.label}</div>
                                <div className="text-sm text-muted-foreground">{preset.duration} • {preset.description}</div>
                                <div className="text-xs text-muted-foreground mt-1">Approximately {preset.wordCount}</div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Voice Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voice Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {voiceError && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {voiceError}
                </div>
              )}
              
              <VoiceSelectionInterface
                language={watchedLanguage}
                selectedHost1Voice={watchedHost1Voice}
                selectedHost2Voice={watchedHost2Voice}
                onVoiceSelect={handleVoiceSelect}
              />
            </CardContent>
          </Card>

          {/* Custom Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Style & Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {INSTRUCTION_TEMPLATES.map((template) => (
                    <Button
                      key={template.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateSelect(template.value)}
                      className="justify-start text-left h-auto p-2"
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="customInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Focus on practical examples and keep the tone conversational..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide specific guidance for the podcast style and content approach.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Generating Podcast..." : "Generate Podcast"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}