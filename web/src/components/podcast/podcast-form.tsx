"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Mic, Users, User, Loader2 } from 'lucide-react';
import { PodcastGenerationForm } from '@/lib/types/podcast';

// Form validation schema
const podcastFormSchema = z.object({
  mode: z.enum(['conversation', 'bulletin'], {
    message: 'Please select a podcast mode',
  }),
  hostVoiceId: z.string().min(1, 'Host voice is required'),
  guestVoiceId: z.string().optional(),
  qualityPreset: z.enum(['standard', 'high', 'highest', 'ultra', 'ultra_lossless'], {
    message: 'Please select a quality preset',
  }),
  durationScale: z.enum(['short', 'default', 'long'], {
    message: 'Please select a duration scale',
  }),
  language: z.string().optional(),
  intro: z.string().optional(),
  outro: z.string().optional(),
}).refine((data) => {
  // For conversation mode, guest voice is required
  if (data.mode === 'conversation' && (!data.guestVoiceId || data.guestVoiceId.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Guest voice is required for conversation mode',
  path: ['guestVoiceId'],
});

type PodcastFormData = z.infer<typeof podcastFormSchema>;

interface PodcastFormProps {
  onSubmit: (data: PodcastGenerationForm) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// Default voice options (these would typically come from ElevenLabs API)
const DEFAULT_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Deep Male)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Well-rounded Male)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Crisp Male)' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam (Raspy Male)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Strong Female)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Sweet Female)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Emotional Female)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Deep Male)' },
];

const QUALITY_PRESETS = [
  { value: 'standard', label: 'Standard', description: 'Good quality, faster generation' },
  { value: 'high', label: 'High', description: 'Better quality, moderate speed' },
  { value: 'highest', label: 'Highest', description: 'Best quality, slower generation' },
  { value: 'ultra', label: 'Ultra', description: 'Premium quality' },
  { value: 'ultra_lossless', label: 'Ultra Lossless', description: 'Maximum quality' },
] as const;

const DURATION_SCALES = [
  { value: 'short', label: 'Short', description: 'Concise podcast (~5-10 min)' },
  { value: 'default', label: 'Default', description: 'Standard length (~10-20 min)' },
  { value: 'long', label: 'Long', description: 'Extended podcast (~20-30 min)' },
] as const;

export function PodcastForm({ onSubmit, isLoading = false, disabled = false }: PodcastFormProps) {
  const form = useForm<PodcastFormData>({
    resolver: zodResolver(podcastFormSchema),
    defaultValues: {
      mode: 'conversation',
      hostVoiceId: DEFAULT_VOICES[0].id,
      guestVoiceId: DEFAULT_VOICES[1].id,
      qualityPreset: 'high',
      durationScale: 'default',
      language: 'en',
    },
  });

  const watchedMode = form.watch('mode');

  const handleSubmit = (data: PodcastFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Generate Podcast
        </CardTitle>
        <CardDescription>
          Configure your AI-generated podcast settings. Choose between conversation or bulletin mode, 
          select voices, and customize quality settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Podcast Mode Selection */}
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Podcast Mode</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                      disabled={disabled}
                      aria-label="Select podcast mode"
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="conversation" id="conversation" />
                        <div className="flex-1">
                          <Label htmlFor="conversation" className="flex items-center gap-2 cursor-pointer">
                            <Users className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Conversation</div>
                              <div className="text-sm text-muted-foreground">Host + Guest dialogue</div>
                            </div>
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="bulletin" id="bulletin" />
                        <div className="flex-1">
                          <Label htmlFor="bulletin" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Bulletin</div>
                              <div className="text-sm text-muted-foreground">Single host narration</div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Voice Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Voice Configuration</h3>
              
              {/* Host Voice */}
              <FormField
                control={form.control}
                name="hostVoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host Voice</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        disabled={disabled}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm  transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Select host voice"
                      >
                        {DEFAULT_VOICES.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      Select the voice for the podcast host
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Guest Voice (only for conversation mode) */}
              {watchedMode === 'conversation' && (
                <FormField
                  control={form.control}
                  name="guestVoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest Voice</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={disabled}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm  transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Select guest voice"
                        >
                          {DEFAULT_VOICES.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                              {voice.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>
                        Select the voice for the podcast guest
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Quality Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Quality & Duration</h3>
              
              {/* Quality Preset */}
              <FormField
                control={form.control}
                name="qualityPreset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio Quality</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 gap-2"
                        disabled={disabled}
                        aria-label="Select audio quality preset"
                      >
                        {QUALITY_PRESETS.map((preset) => (
                          <div key={preset.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                            <RadioGroupItem value={preset.value} id={preset.value} />
                            <div className="flex-1">
                              <Label htmlFor={preset.value} className="cursor-pointer">
                                <div className="font-medium">{preset.label}</div>
                                <div className="text-sm text-muted-foreground">{preset.description}</div>
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

              {/* Duration Scale */}
              <FormField
                control={form.control}
                name="durationScale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Podcast Length</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-4"
                        disabled={disabled}
                        aria-label="Select podcast duration"
                      >
                        {DURATION_SCALES.map((scale) => (
                          <div key={scale.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                            <RadioGroupItem value={scale.value} id={scale.value} />
                            <div className="flex-1">
                              <Label htmlFor={scale.value} className="cursor-pointer">
                                <div className="font-medium text-sm">{scale.label}</div>
                                <div className="text-xs text-muted-foreground">{scale.description}</div>
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
            </div>

            {/* Optional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Optional Settings</h3>
              
              {/* Language */}
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="en"
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormDescription>
                      Language code for the podcast (e.g., en, es, fr)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Intro */}
              <FormField
                control={form.control}
                name="intro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Intro (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Welcome to our podcast..."
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom introduction text for the podcast
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Outro */}
              <FormField
                control={form.control}
                name="outro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Outro (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Thanks for listening..."
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom closing text for the podcast
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={disabled || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Generate Podcast
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}