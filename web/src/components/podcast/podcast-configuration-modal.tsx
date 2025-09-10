"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PodcastConfig } from "@/lib/types/podcast.types"
import { VoiceSelectionInterface } from "./voice-selection-interface"

// Form validation schema
const podcastConfigSchema = z.object({
  language: z.string().min(1, "Language is required"),
  durationPreset: z.enum(["short", "medium", "long"], {
    required_error: "Duration preset is required",
  }),
  host1VoiceId: z.string().min(1, "Host 1 voice is required"),
  host1VoiceName: z.string().min(1, "Host 1 voice name is required"),
  host2VoiceId: z.string().min(1, "Host 2 voice is required"),
  host2VoiceName: z.string().min(1, "Host 2 voice name is required"),
  customInstructions: z.string().optional(),
})

type FormData = z.infer<typeof podcastConfigSchema>

interface PodcastConfigurationModalProps {
  noteId: string
  isOpen: boolean
  onClose: () => void
  onGenerate: (config: PodcastConfig) => void
}

// Language options
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
]

// Duration presets with estimates
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
]

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
]

export function PodcastConfigurationModal({
  noteId,
  isOpen,
  onClose,
  onGenerate,
}: PodcastConfigurationModalProps) {
  const [voiceError, setVoiceError] = useState<string | null>(null)

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
  })

  const watchedLanguage = form.watch("language")
  const watchedHost1Voice = form.watch("host1VoiceId")
  const watchedHost2Voice = form.watch("host2VoiceId")

  // Clear voice selections when language changes
  useEffect(() => {
    form.setValue("host1VoiceId", "")
    form.setValue("host1VoiceName", "")
    form.setValue("host2VoiceId", "")
    form.setValue("host2VoiceName", "")
  }, [watchedLanguage, form])

  const handleVoiceSelect = (voiceId: string, voiceName: string, hostNumber: 1 | 2) => {
    if (hostNumber === 1) {
      form.setValue("host1VoiceId", voiceId)
      form.setValue("host1VoiceName", voiceName)
    } else {
      form.setValue("host2VoiceId", voiceId)
      form.setValue("host2VoiceName", voiceName)
    }
  }

  const handleTemplateSelect = (template: string) => {
    form.setValue("customInstructions", template)
  }

  const onSubmit = (data: FormData) => {
    // Validate that different voices are selected
    if (data.host1VoiceId === data.host2VoiceId) {
      form.setError("host2VoiceId", {
        message: "Please select different voices for each host"
      })
      return
    }

    const config: PodcastConfig = {
      language: data.language,
      durationPreset: data.durationPreset,
      host1VoiceId: data.host1VoiceId,
      host1VoiceName: data.host1VoiceName,
      host2VoiceId: data.host2VoiceId,
      host2VoiceName: data.host2VoiceName,
      customInstructions: data.customInstructions,
    }

    onGenerate(config)
  }

  const handleClose = () => {
    // Reset form
    form.reset()
    setVoiceError(null)
    onClose()
  }

  const isFormValid = form.formState.isValid && 
    watchedHost1Voice && 
    watchedHost2Voice && 
    watchedHost1Voice !== watchedHost2Voice

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Podcast</DialogTitle>
          <DialogDescription>
            Configure your podcast settings to transform your notes into an engaging conversation between two AI hosts.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Language Selection */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {LANGUAGE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
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

            {/* Duration Selection */}
            <FormField
              control={form.control}
              name="durationPreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid gap-4"
                    >
                      {DURATION_PRESETS.map((preset) => (
                        <div key={preset.value} className="flex items-center space-x-3">
                          <RadioGroupItem value={preset.value} id={preset.value} />
                          <Label htmlFor={preset.value} className="flex-1 cursor-pointer">
                            <Card className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{preset.label}</div>
                                  <div className="text-sm text-muted-foreground">{preset.description}</div>
                                </div>
                                <div className="text-right text-sm">
                                  <div className="font-medium">{preset.duration}</div>
                                  <div className="text-muted-foreground">{preset.wordCount}</div>
                                </div>
                              </div>
                            </Card>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Voice Selection */}
            <div className="space-y-6">
              <VoiceSelectionInterface
                language={watchedLanguage}
                selectedHost1Voice={watchedHost1Voice}
                selectedHost2Voice={watchedHost2Voice}
                onVoiceSelect={handleVoiceSelect}
                onError={setVoiceError}
              />
              
              {/* Form validation for voices */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="host1VoiceId"
                  render={() => (
                    <FormItem className="hidden">
                      <FormControl>
                        <input type="hidden" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="host2VoiceId"
                  render={() => (
                    <FormItem className="hidden">
                      <FormControl>
                        <input type="hidden" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Custom Instructions */}
            <FormField
              control={form.control}
              name="customInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Instructions (Optional)</FormLabel>
                  <FormDescription>
                    Provide specific guidance for the podcast style and content approach.
                  </FormDescription>
                  
                  {/* Template buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {INSTRUCTION_TEMPLATES.map((template) => (
                      <Button
                        key={template.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateSelect(template.value)}
                      >
                        {template.label}
                      </Button>
                    ))}
                  </div>
                  
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Focus on practical examples and keep the tone conversational..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isFormValid}
              >
                Generate Podcast
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}