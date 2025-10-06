"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Play, Pause, Volume2, Users, Sparkles, AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { VoiceSelectionSkeleton } from "./podcast-loading-states"
import { Separator } from "@/components/ui/separator"

import { Voice } from "@/lib/types/podcast.types"
import { elevenLabsService } from "@/lib/eleven-labs/elevenlabs-service"

interface VoiceSelectionInterfaceProps {
  language: string
  selectedHost1Voice?: string
  selectedHost2Voice?: string
  onVoiceSelect: (voiceId: string, voiceName: string, hostNumber: 1 | 2) => void
  onError?: (error: string) => void
}

interface VoicePairing {
  host1: Voice
  host2: Voice
  compatibility: 'excellent' | 'good' | 'fair'
  reason: string
}

export function VoiceSelectionInterface({
  language,
  selectedHost1Voice,
  selectedHost2Voice,
  onVoiceSelect,
  onError,
}: VoiceSelectionInterfaceProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playingPreview, setPlayingPreview] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map())
  const [suggestedPairings, setSuggestedPairings] = useState<VoicePairing[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Load voices when language changes
  useEffect(() => {
    if (language) {
      loadVoices(language)
    }
  }, [language])

  // Generate voice pairings when voices are loaded
  useEffect(() => {
    if (voices.length > 0) {
      generateVoicePairings()
    }
  }, [voices])

  const loadVoices = async (lang: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const availableVoices = await elevenLabsService.getVoices(lang)
      setVoices(availableVoices)
    } catch (err) {
      const errorMessage = "Failed to load voices. Please check your connection and try again."
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const generateVoicePairings = useCallback(() => {
    if (voices.length < 2) return

    const pairings: VoicePairing[] = []
    
    // Generate complementary pairings based on voice characteristics
    for (let i = 0; i < voices.length; i++) {
      for (let j = i + 1; j < voices.length; j++) {
        const voice1 = voices[i]
        const voice2 = voices[j]
        
        const pairing = evaluateVoicePairing(voice1, voice2)
        if (pairing.compatibility !== 'fair') {
          pairings.push(pairing)
        }
      }
    }

    // Sort by compatibility and limit to top suggestions
    pairings.sort((a, b) => {
      const compatibilityOrder = { excellent: 3, good: 2, fair: 1 }
      return compatibilityOrder[b.compatibility] - compatibilityOrder[a.compatibility]
    })

    setSuggestedPairings(pairings.slice(0, 6))
  }, [voices])

  const evaluateVoicePairing = (voice1: Voice, voice2: Voice): VoicePairing => {
    let compatibility: 'excellent' | 'good' | 'fair' = 'fair'
    let reason = ''

    // Check for complementary characteristics
    const genderDifferent = voice1.gender !== voice2.gender
    const ageDifferent = voice1.age !== voice2.age
    const accentSimilar = voice1.accent === voice2.accent

    if (genderDifferent && ageDifferent && accentSimilar) {
      compatibility = 'excellent'
      reason = 'Perfect contrast with complementary voices'
    } else if (genderDifferent && accentSimilar) {
      compatibility = 'good'
      reason = 'Good gender contrast with matching accents'
    } else if (ageDifferent && accentSimilar) {
      compatibility = 'good'
      reason = 'Nice age contrast with consistent accent'
    } else if (genderDifferent || ageDifferent) {
      compatibility = 'good'
      reason = 'Some contrast between voices'
    } else {
      compatibility = 'fair'
      reason = 'Similar voice characteristics'
    }

    return {
      host1: voice1,
      host2: voice2,
      compatibility,
      reason,
    }
  }

  const playVoicePreview = async (voiceId: string) => {
    if (playingPreview === voiceId) {
      // Stop current preview
      const audio = audioElements.get(voiceId)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setPlayingPreview(null)
      return
    }

    try {
      setPlayingPreview(voiceId)
      
      // Check if we already have audio element for this voice
      let audio = audioElements.get(voiceId)
      
      if (!audio) {
        // Generate preview audio
        const previewBuffer = await elevenLabsService.getVoicePreview(voiceId)
        const uint8Array = new Uint8Array(previewBuffer)
        const blob = new Blob([uint8Array], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(blob)
        
        audio = new Audio(audioUrl)
        audio.addEventListener('ended', () => {
          setPlayingPreview(null)
        })
        audio.addEventListener('error', () => {
          setPlayingPreview(null)
        })
        
        setAudioElements(prev => new Map(prev).set(voiceId, audio!))
      }
      
      await audio.play()
    } catch (err) {
      console.error("Failed to play voice preview:", err)
      setPlayingPreview(null)
    }
  }

  const handleVoiceSelect = (voice: Voice, hostNumber: 1 | 2) => {
    onVoiceSelect(voice.id, voice.name, hostNumber)
  }

  const handlePairingSelect = (pairing: VoicePairing) => {
    onVoiceSelect(pairing.host1.id, pairing.host1.name, 1)
    onVoiceSelect(pairing.host2.id, pairing.host2.name, 2)
    setShowSuggestions(false)
  }

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCompatibilityIcon = (compatibility: string) => {
    switch (compatibility) {
      case 'excellent':
        return <Sparkles className="h-3 w-3" />
      case 'good':
        return <Users className="h-3 w-3" />
      default:
        return null
    }
  }

  if (loading) {
    return <VoiceSelectionSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md border border-gray-300 rounded-2xl p-5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error Loading Voices</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={() => loadVoices(language)}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (voices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No voices available for the selected language.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Voice Pairing Suggestions */}
      {suggestedPairings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Suggested Voice Pairings</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </Button>
          </div>
          
          {showSuggestions && (
            <div className="grid gap-3 mb-6">
              {suggestedPairings.slice(0, 3).map((pairing, index) => (
                <Card
                  key={`${pairing.host1.id}-${pairing.host2.id}`}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handlePairingSelect(pairing)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getCompatibilityColor(pairing.compatibility)}`}
                          >
                            {getCompatibilityIcon(pairing.compatibility)}
                            <span className="ml-1 capitalize">{pairing.compatibility}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">{pairing.reason}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="font-medium text-sm">Host 1: {pairing.host1.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {pairing.host1.gender} • {pairing.host1.age} • {pairing.host1.accent}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-sm">Host 2: {pairing.host2.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {pairing.host2.gender} • {pairing.host2.age} • {pairing.host2.accent}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Use This Pairing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <Separator />
        </div>
      )}

      {/* Individual Voice Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4">Select Individual Voices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Host 1 Selection */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              Host 1 Voice
            </h4>
            <div className="space-y-3">
              {voices.slice(0, 3).map((voice) => (
                <VoiceCard
                  key={`host1-${voice.id}`}
                  voice={voice}
                  isSelected={selectedHost1Voice === voice.id}
                  isDisabled={selectedHost2Voice === voice.id}
                  isPlaying={playingPreview === voice.id}
                  onSelect={() => handleVoiceSelect(voice, 1)}
                  onPreview={() => playVoicePreview(voice.id)}
                  disabledReason={selectedHost2Voice === voice.id ? "Already selected for Host 2" : undefined}
                />
              ))}
            </div>
          </div>

          {/* Host 2 Selection */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              Host 2 Voice
            </h4>
            <div className="space-y-3">
              {voices.slice(4, 7).map((voice) => (
                <VoiceCard
                  key={`host2-${voice.id}`}
                  voice={voice}
                  isSelected={selectedHost2Voice === voice.id}
                  isDisabled={selectedHost1Voice === voice.id}
                  isPlaying={playingPreview === voice.id}
                  onSelect={() => handleVoiceSelect(voice, 2)}
                  onPreview={() => playVoicePreview(voice.id)}
                  disabledReason={selectedHost1Voice === voice.id ? "Already selected for Host 1" : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface VoiceCardProps {
  voice: Voice
  isSelected: boolean
  isDisabled: boolean
  isPlaying: boolean
  onSelect: () => void
  onPreview: () => void
  disabledReason?: string
}

function VoiceCard({
  voice,
  isSelected,
  isDisabled,
  isPlaying,
  onSelect,
  onPreview,
  disabledReason,
}: VoiceCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all h-32 ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : isDisabled
          ? "opacity-50 cursor-not-allowed border-muted"
          : "hover:border-primary/50 hover:shadow-sm"
      }`}
      onClick={isDisabled ? undefined : onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium">{voice.name}</div>
            <div className="text-sm text-muted-foreground mb-2">
              {voice.description}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {voice.gender}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {voice.age.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {voice.accent}
              </Badge>
            </div>
            {disabledReason && (
              <div className="text-xs text-muted-foreground mt-2 italic">
                {disabledReason}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onPreview()
              }}
              disabled={isPlaying}
              className="shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            {isSelected && (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">✓</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}