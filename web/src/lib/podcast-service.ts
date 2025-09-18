import {
    Podcast,
    PodcastConfig,
    PodcastScript,
    AudioSegment,
    PodcastMetadata,
    ValidationResult,
    PodcastGenerationError
} from './types/podcast.types';

/**
 * Core service for podcast generation and management
 * Handles script generation, audio synthesis coordination, and storage
 */
export class PodcastService {
    private readonly supportedLanguages = ['en', 'es', 'fr', 'de'];
    private readonly durationLimits = {
        short: { min: 180, max: 420 }, // 3-7 minutes
        medium: { min: 480, max: 900 }, // 8-15 minutes
        long: { min: 960, max: 1800 } // 16-30 minutes
    };

    /**
     * Validates podcast configuration before generation
     */
    validateConfiguration(config: PodcastConfig): ValidationResult {
        const errors: string[] = [];

        // Validate language
        if (!this.supportedLanguages.includes(config.language)) {
            errors.push(`Unsupported language: ${config.language}`);
        }

        // Validate duration preset
        if (!['short', 'medium', 'long'].includes(config.durationPreset)) {
            errors.push(`Invalid duration preset: ${config.durationPreset}`);
        }

        // Validate voice IDs
        if (!config.host1VoiceId || !config.host1VoiceName) {
            errors.push('Host 1 voice configuration is required');
        }

        if (!config.host2VoiceId || !config.host2VoiceName) {
            errors.push('Host 2 voice configuration is required');
        }

        // Ensure different voices for hosts
        if (config.host1VoiceId === config.host2VoiceId) {
            errors.push('Host voices must be different');
        }

        // Validate custom instructions length
        if (config.customInstructions && config.customInstructions.length > 1000) {
            errors.push('Custom instructions must be less than 1000 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Generates conversational script from note content
     * Converts structured note content into natural dialogue between two hosts
     */
    async generateScript(noteContent: string, config: PodcastConfig): Promise<PodcastScript> {
        try {
            // Validate configuration first
            const validation = this.validateConfiguration(config);
            if (!validation.isValid) {
                throw new PodcastGenerationError(
                    `Configuration validation failed: ${validation.errors.join(', ')}`,
                    { code: 'CONFIGURATION_INVALID', details: validation.errors }
                );
            }

            // Validate note content - be more lenient
            if (!noteContent || noteContent.trim().length < 10) {
                throw new PodcastGenerationError(
                    'Note content must be at least 10 characters long',
                    { code: 'SCRIPT_GENERATION_FAILED', details: 'Insufficient content' }
                );
            }

            // Import AI SDK dynamically
            const { generateObject } = await import('ai');
            const { openai } = await import('@ai-sdk/openai');
            const { z } = await import('zod');

            const model = openai('gpt-4o');

            // Get duration constraints
            const durationLimits = this.durationLimits[config.durationPreset];
            const targetDuration = this.estimateDuration(noteContent, config.durationPreset);

            // Create schema for script generation - simplified
            const scriptSchema = z.object({
                segments: z.array(z.object({
                    speaker: z.enum(['host1', 'host2']).describe('Which host is speaking'),
                    content: z.string().min(1).describe('What the host says - natural conversational speech'),
                    sequenceOrder: z.number().describe('Order of this segment in the conversation')
                })).min(2).describe('Array of conversation segments between hosts'),
                metadata: z.object({
                    language: z.string().describe('Language of the script'),
                    style: z.string().describe('Conversational style used'),
                    hosts: z.object({
                        host1: z.string().describe('Personality/role of host 1'),
                        host2: z.string().describe('Personality/role of host 2')
                    })
                })
            });

            // Generate the conversational script
            const result = await generateObject({
                model,
                schema: scriptSchema,
                prompt: this.buildScriptPrompt(noteContent, config, targetDuration, durationLimits),
                temperature: 0.8, // Higher temperature for more creative conversation
            });

            // Calculate estimated duration for each segment
            const segmentsWithDuration = result.object.segments.map(segment => ({
                ...segment,
                estimatedDuration: this.estimateSegmentDuration(segment.content)
            }));

            // Calculate total estimated duration
            const totalEstimatedDuration = segmentsWithDuration.reduce(
                (total, segment) => total + (segment.estimatedDuration || 0),
                0
            );

            const script: PodcastScript = {
                segments: segmentsWithDuration,
                totalEstimatedDuration,
                metadata: result.object.metadata
            };

            // Validate and optimize the script
            const optimizedScript = await this.validateAndOptimizeScript(script, config, durationLimits);

            return optimizedScript;
        } catch (error) {
            if (error instanceof PodcastGenerationError) {
                throw error;
            }
            throw new PodcastGenerationError(
                'Failed to generate podcast script',
                { code: 'SCRIPT_GENERATION_FAILED', details: error }
            );
        }
    }

    /**
     * Coordinates audio synthesis for all script segments
     * Uses ElevenLabsService to generate audio for each speaker
     */
    async synthesizeAudio(script: PodcastScript, config: PodcastConfig): Promise<AudioSegment[]> {
        try {
            // TODO: Implement audio synthesis coordination
            // This will use ElevenLabsService to generate audio for each script segment
            // Will maintain consistent voice characteristics throughout
            // Will handle retry logic for API failures

            throw new Error('Audio synthesis not yet implemented');
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to synthesize podcast audio',
                { code: 'VOICE_SYNTHESIS_FAILED', details: error }
            );
        }
    }

    /**
     * Assembles individual audio segments into complete podcast
     * Combines segments with proper timing and transitions
     */
    async assembleAudio(segments: AudioSegment[]): Promise<Buffer> {
        try {
            // TODO: Implement audio assembly
            // This will use AudioProcessingService to combine segments
            // Will ensure smooth transitions between speakers
            // Will produce single, seamless audio file

            throw new Error('Audio assembly not yet implemented');
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to assemble podcast audio',
                { code: 'AUDIO_PROCESSING_FAILED', details: error }
            );
        }
    }

    /**
     * Saves podcast to storage and database
     * Uploads audio to UploadThing and stores metadata
     */
    async savePodcast(audioBuffer: Buffer, metadata: PodcastMetadata, noteId: string, userId?: string): Promise<Podcast> {
        try {
            const { uploadThingAudioStorageService } = await import('./uploadthing-audio-storage-service');
            const { prisma } = await import('./prisma');

            // Validate audio buffer before upload
            const validation = await uploadThingAudioStorageService.validateAudioBuffer(audioBuffer);
            if (!validation.isValid) {
                throw new PodcastGenerationError(
                    `Audio validation failed: ${validation.errors.join(', ')}`,
                    { code: 'STORAGE_FAILED', details: validation.errors }
                );
            }

            // Generate podcast ID if not provided
            const podcastId = metadata.id || this.generatePodcastId();

            try {
                // Upload audio to UploadThing storage
                const audioUrl = await uploadThingAudioStorageService.uploadPodcastAudio(audioBuffer, {
                    podcastId,
                    noteId,
                    userId,
                    title: metadata.title,
                    language: metadata.language,
                    durationPreset: metadata.durationPreset
                });

                // Save podcast metadata to database
                const createdPodcast = await prisma.podcast.create({
                    data: {
                        id: podcastId,
                        noteId,
                        userId,
                        title: metadata.title,
                        description: metadata.description,
                        language: metadata.language,
                        durationPreset: metadata.durationPreset,
                        estimatedDuration: metadata.estimatedDuration,
                        actualDuration: validation.metadata.estimatedDurationSeconds,
                        host1VoiceId: metadata.host1VoiceId,
                        host1VoiceName: metadata.host1VoiceName,
                        host2VoiceId: metadata.host2VoiceId,
                        host2VoiceName: metadata.host2VoiceName,
                        customInstructions: metadata.customInstructions,
                        audioUrl,
                        transcriptData: metadata.transcriptData,
                        generationStatus: 'completed',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });

                // Convert null to undefined for TypeScript compatibility
                const podcast: Podcast = {
                    ...createdPodcast,
                    userId: createdPodcast.userId ?? undefined,
                    description: createdPodcast.description ?? undefined,
                    estimatedDuration: createdPodcast.estimatedDuration ?? undefined,
                    actualDuration: createdPodcast.actualDuration ?? undefined,
                    customInstructions: createdPodcast.customInstructions ?? undefined,
                    audioUrl: createdPodcast.audioUrl ?? undefined,
                    generationError: createdPodcast.generationError ?? undefined,
                    durationPreset: createdPodcast.durationPreset as 'short' | 'medium' | 'long',
                    generationStatus: createdPodcast.generationStatus as 'pending' | 'generating' | 'completed' | 'failed',
                    transcriptData: createdPodcast.transcriptData ? createdPodcast.transcriptData as any : undefined
                };

                // Index podcast transcript for chatbot integration
                try {
                    await this.indexPodcastTranscript(podcastId, noteId);
                    console.log(`Podcast transcript indexed successfully for ${podcastId}`);
                } catch (indexError) {
                    console.error(`Failed to index podcast transcript for ${podcastId}:`, indexError);
                    // Don't fail the entire operation if indexing fails
                }

                return podcast;
            } catch (storageError) {
                // If UploadThing fails, throw the error directly
                throw new PodcastGenerationError(
                    `Storage error: Failed to upload audio to UploadThing`,
                    { code: 'STORAGE_FAILED', details: storageError }
                );
            }
        } catch (error) {
            if (error instanceof PodcastGenerationError) {
                throw error;
            }
            throw new PodcastGenerationError(
                'Failed to save podcast',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Indexes podcast transcript in embedding service for chatbot integration
     * Creates searchable chunks from podcast segments with metadata
     */
    async indexPodcastTranscript(podcastId: string, noteId: string): Promise<void> {
        try {
            const { prisma } = await import('./prisma');
            const { indexPodcastTranscript } = await import('./course/embedding-service');

            // Fetch podcast segments from database
            const segments = await prisma.podcastSegment.findMany({
                where: { podcastId },
                orderBy: { sequenceOrder: 'asc' }
            });

            if (segments.length === 0) {
                console.log(`No segments found for podcast ${podcastId}`);
                return;
            }

            // Index the transcript segments for chatbot integration
            await indexPodcastTranscript(noteId, podcastId, segments);

            console.log(`Successfully indexed transcript for podcast ${podcastId} with ${segments.length} segments`);
        } catch (error) {
            console.error(`Failed to index podcast transcript for ${podcastId}:`, error);
            throw new PodcastGenerationError(
                'Failed to index podcast transcript',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Generates AI responses for podcast-specific Q&A
     * Provides context-aware answers with timestamp references
     */
    async chatWithPodcast(podcastId: string, query: string): Promise<string> {
        try {
            // TODO: Implement AI chatbot functionality
            // This will use OpenAI GPT-4 with full podcast context
            // Will provide answers with timestamp references
            // Will handle speaker-specific queries and time-range summaries

            throw new Error('Podcast chat not yet implemented');
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to process podcast chat query',
                { code: 'SCRIPT_GENERATION_FAILED', details: error }
            );
        }
    }

    /**
     * Estimates podcast duration based on content and configuration
     */
    estimateDuration(noteContent: string, durationPreset: 'short' | 'medium' | 'long'): number {
        const wordCount = noteContent.split(/\s+/).length;
        const wordsPerMinute = 150; // Average speaking rate
        const baseMinutes = wordCount / wordsPerMinute;

        // Apply preset multipliers for conversation expansion
        const multipliers = {
            short: 1.2, // Concise conversation
            medium: 1.5, // Balanced conversation
            long: 2.0   // Detailed conversation with examples
        };

        const estimatedMinutes = baseMinutes * multipliers[durationPreset];
        const limits = this.durationLimits[durationPreset];

        // Clamp to preset limits
        return Math.max(limits.min, Math.min(limits.max, estimatedMinutes * 60));
    }

    /**
     * Gets supported languages for podcast generation
     */
    getSupportedLanguages(): string[] {
        return [...this.supportedLanguages];
    }

    /**
     * Gets duration presets with their limits
     */
    getDurationPresets() {
        return {
            short: { label: 'Short (3-7 minutes)', ...this.durationLimits.short },
            medium: { label: 'Medium (8-15 minutes)', ...this.durationLimits.medium },
            long: { label: 'Long (16-30 minutes)', ...this.durationLimits.long }
        };
    }

    /**
     * Generates a unique podcast ID
     */
    private generatePodcastId(): string {
        return `podcast_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Saves individual audio segments to storage
     */
    async saveAudioSegments(segments: AudioSegment[], podcastId: string): Promise<void> {
        try {
            const { uploadThingAudioStorageService } = await import('./uploadthing-audio-storage-service');
            const { prisma } = await import('./prisma');

            // Upload each segment to storage
            const segmentPromises = segments.map(async (segment, index) => {
                if (segment.audioBuffer) {
                    // Upload segment audio
                    const segmentUrl = await uploadThingAudioStorageService.uploadAudioSegment(
                        segment.audioBuffer,
                        {
                            podcastId,
                            segmentId: `${podcastId}_segment_${index}`,
                            speaker: segment.speaker,
                            sequenceOrder: segment.sequenceOrder
                        }
                    );

                    // Save segment metadata to database
                    await prisma.podcastSegment.create({
                        data: {
                            podcastId,
                            speaker: segment.speaker,
                            content: segment.content,
                            startTime: segment.startTime,
                            endTime: segment.endTime,
                            audioUrl: segmentUrl,
                            sequenceOrder: segment.sequenceOrder
                        }
                    });
                }
            });

            await Promise.all(segmentPromises);
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to save audio segments',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Deletes podcast and all associated files from storage
     */
    async deletePodcast(podcastId: string): Promise<void> {
        try {
            const { uploadThingAudioStorageService } = await import('./uploadthing-audio-storage-service');
            const { prisma } = await import('./prisma');

            // Delete from UploadThing storage (note: requires file keys to be stored in database)
            await uploadThingAudioStorageService.deletePodcastAudio(podcastId);

            // Delete from database
            await prisma.podcastSegment.deleteMany({
                where: { podcastId }
            });

            await prisma.podcast.delete({
                where: { id: podcastId }
            });
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to delete podcast',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Builds the AI prompt for script generation
     */
    private buildScriptPrompt(
        noteContent: string,
        config: PodcastConfig,
        targetDuration: number,
        durationLimits: { min: number; max: number }
    ): string {
        const durationMinutes = Math.round(targetDuration / 60);
        const wordCount = noteContent.split(/\s+/).length;

        return `You are an expert podcast script writer. Create an engaging conversational script between two AI hosts discussing the provided content.

CONTENT TO DISCUSS:
${noteContent}

SCRIPT REQUIREMENTS:
- Language: ${config.language}
- Target Duration: ${durationMinutes} minutes (${durationLimits.min}-${Math.round(durationLimits.max / 60)} minutes range)
- Content Length: ~${wordCount} words
- Two distinct hosts with different personalities and speaking styles

HOST PERSONALITIES:
- Host 1 (${config.host1VoiceName}): Curious, asks thoughtful questions, brings up interesting points
- Host 2 (${config.host2VoiceName}): Knowledgeable, explains concepts clearly, provides examples and insights

CONVERSATION STYLE:
- Natural, engaging dialogue that flows smoothly
- Include questions, responses, and natural transitions
- Balance speaking time between both hosts (roughly 50/50)
- Use conversational language, not formal or robotic
- Include natural speech patterns like "you know," "actually," "that's interesting"
- Build on each other's points and create genuine discussion

CONTENT GUIDELINES:
- Cover all major points from the source material
- Expand on key concepts with examples and explanations
- Create natural conversation flow with smooth transitions
- Include engaging questions and thoughtful responses
- Make complex topics accessible and interesting
- End with a natural conclusion that summarizes key takeaways

${config.customInstructions ? `CUSTOM INSTRUCTIONS: ${config.customInstructions}` : ''}

Generate a script with alternating speakers that creates an engaging, educational conversation about the provided content.`;
    }

    /**
     * Estimates duration for a single script segment
     */
    private estimateSegmentDuration(content: string): number {
        const wordCount = content.split(/\s+/).length;
        const wordsPerSecond = 2.5; // Average conversational speaking rate
        return Math.round(wordCount / wordsPerSecond);
    }

    /**
     * Validates and optimizes the generated script - simplified
     */
    private async validateAndOptimizeScript(
        script: PodcastScript,
        config: PodcastConfig,
        durationLimits: { min: number; max: number }
    ): Promise<PodcastScript> {
        // Basic validation only - very minimal to avoid failures
        if (!script.segments || script.segments.length === 0) {
            throw new PodcastGenerationError(
                'Script must have at least one segment',
                { code: 'SCRIPT_GENERATION_FAILED', details: 'Empty script' }
            );
        }

        // Only check for critical issues
        const criticalErrors: string[] = [];
        script.segments.forEach((segment, index) => {
            if (!segment.content || segment.content.trim().length === 0) {
                criticalErrors.push(`Segment ${index + 1} has no content`);
            }
            if (!['host1', 'host2'].includes(segment.speaker)) {
                // Auto-fix invalid speakers
                segment.speaker = index % 2 === 0 ? 'host1' : 'host2';
            }
        });

        if (criticalErrors.length > 0) {
            throw new PodcastGenerationError(
                `Critical script issues: ${criticalErrors.join(', ')}`,
                { code: 'SCRIPT_GENERATION_FAILED', details: criticalErrors }
            );
        }

        // Validate segment order and fix any issues
        const fixedScript = this.validateAndFixSegmentOrder(script);

        return fixedScript;
    }

    /**
     * Expands script to meet minimum duration requirements
     */
    private async expandScript(
        script: PodcastScript,
        config: PodcastConfig,
        minDuration: number
    ): Promise<PodcastScript> {
        const currentDuration = script.totalEstimatedDuration;
        const additionalTimeNeeded = minDuration - currentDuration;

        // Add more conversational elements like examples, questions, and elaborations
        const expandedSegments = script.segments.map((segment, index) => {
            if (index % 3 === 0) { // Expand every third segment
                const expansion = this.generateExpansionContent(segment.content, segment.speaker);
                return {
                    ...segment,
                    content: segment.content + ' ' + expansion,
                    estimatedDuration: this.estimateSegmentDuration(segment.content + ' ' + expansion)
                };
            }
            return segment;
        });

        const newTotalDuration = expandedSegments.reduce(
            (total, segment) => total + (segment.estimatedDuration || 0),
            0
        );

        return {
            ...script,
            segments: expandedSegments,
            totalEstimatedDuration: newTotalDuration
        };
    }

    /**
     * Condenses script to meet maximum duration requirements
     */
    private async condenseScript(
        script: PodcastScript,
        config: PodcastConfig,
        maxDuration: number
    ): Promise<PodcastScript> {
        // Remove redundant content and make segments more concise
        const condensedSegments = script.segments.map(segment => {
            const condensedContent = this.condenseContent(segment.content);
            return {
                ...segment,
                content: condensedContent,
                estimatedDuration: this.estimateSegmentDuration(condensedContent)
            };
        });

        const newTotalDuration = condensedSegments.reduce(
            (total, segment) => total + (segment.estimatedDuration || 0),
            0
        );

        return {
            ...script,
            segments: condensedSegments,
            totalEstimatedDuration: newTotalDuration
        };
    }

    /**
     * Balances speaking time between hosts
     */
    private balanceSpeakingTime(script: PodcastScript): PodcastScript {
        const balance = this.calculateSpeakingTimeBalance(script);
        const imbalanceThreshold = 20; // Allow 20% imbalance

        if (balance.imbalancePercentage <= imbalanceThreshold) {
            return script; // Already balanced
        }

        // Determine which host needs more speaking time
        const needsMoreTime = balance.host1Percentage < balance.host2Percentage ? 'host1' : 'host2';
        const hasMoreTime = needsMoreTime === 'host1' ? 'host2' : 'host1';

        // Strategy: Redistribute content by adjusting segment lengths and adding content
        const balancedSegments = script.segments.map((segment, index) => {
            if (segment.speaker === needsMoreTime) {
                // Expand segments for the host who needs more time
                const expansion = this.generateBalancingExpansion(segment.content, segment.speaker);
                const newContent = segment.content + ' ' + expansion;
                return {
                    ...segment,
                    content: newContent,
                    estimatedDuration: this.estimateSegmentDuration(newContent)
                };
            } else if (segment.speaker === hasMoreTime && segment.content.length > 100) {
                // Slightly condense segments for the host who has too much time
                const condensedContent = this.condenseForBalance(segment.content);
                return {
                    ...segment,
                    content: condensedContent,
                    estimatedDuration: this.estimateSegmentDuration(condensedContent)
                };
            }
            return segment;
        });

        // Recalculate total duration
        const newTotalDuration = balancedSegments.reduce(
            (total, segment) => total + (segment.estimatedDuration || 0),
            0
        );

        return {
            ...script,
            segments: balancedSegments,
            totalEstimatedDuration: newTotalDuration
        };
    }

    /**
     * Improves conversation flow with better transitions
     */
    private improveConversationFlow(script: PodcastScript): PodcastScript {
        const improvedSegments = script.segments.map((segment, index) => {
            if (index > 0) {
                const previousSegment = script.segments[index - 1];
                if (previousSegment.speaker !== segment.speaker) {
                    // Add natural transition phrases
                    const transitionContent = this.addTransition(segment.content, previousSegment.content);
                    return {
                        ...segment,
                        content: transitionContent,
                        estimatedDuration: this.estimateSegmentDuration(transitionContent)
                    };
                }
            }
            return segment;
        });

        const newTotalDuration = improvedSegments.reduce(
            (total, segment) => total + (segment.estimatedDuration || 0),
            0
        );

        return {
            ...script,
            segments: improvedSegments,
            totalEstimatedDuration: newTotalDuration
        };
    }

    /**
     * Generates expansion content for segments that are too short
     */
    private generateExpansionContent(content: string, speaker: 'host1' | 'host2'): string {
        const expansions = {
            host1: [
                "That's really interesting. Can you tell us more about that?",
                "I'm curious about how this applies in practice.",
                "What would you say is the most important thing to remember here?",
                "That reminds me of something I read recently."
            ],
            host2: [
                "Absolutely. Let me give you a concrete example.",
                "That's a great question. Here's another way to think about it.",
                "You know, this is particularly important because...",
                "Building on that point, I think it's worth noting that..."
            ]
        };

        const options = expansions[speaker];
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Condenses content by removing redundant phrases
     */
    private condenseContent(content: string): string {
        return content
            .replace(/\b(you know|actually|basically|essentially|really|very|quite)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Adds natural transitions between speakers
     */
    private addTransition(currentContent: string, previousContent: string): string {
        const transitions = [
            "That's exactly right.",
            "Building on that,",
            "Absolutely, and",
            "That's a great point.",
            "Exactly, and I'd add that",
            "Right, and another thing is"
        ];

        // Don't add transition if content already starts with one
        if (currentContent.match(/^(that's|exactly|absolutely|right|building)/i)) {
            return currentContent;
        }

        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        return `${transition} ${currentContent.charAt(0).toLowerCase()}${currentContent.slice(1)}`;
    }

    /**
     * Validates script quality and structure - simplified
     */
    private validateScriptQuality(script: PodcastScript): ValidationResult {
        const errors: string[] = [];

        // Only check for absolutely critical issues
        if (!script.segments || script.segments.length === 0) {
            errors.push('Script must have at least one segment');
        }

        // Basic segment validation
        script.segments.forEach((segment, index) => {
            if (!segment.content || segment.content.trim().length === 0) {
                errors.push(`Segment ${index + 1} has no content`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculates speaking time balance between hosts
     */
    private calculateSpeakingTimeBalance(script: PodcastScript): {
        host1Duration: number;
        host2Duration: number;
        host1Percentage: number;
        host2Percentage: number;
        imbalancePercentage: number;
    } {
        const host1Duration = script.segments
            .filter(s => s.speaker === 'host1')
            .reduce((total, s) => total + (s.estimatedDuration || 0), 0);

        const host2Duration = script.segments
            .filter(s => s.speaker === 'host2')
            .reduce((total, s) => total + (s.estimatedDuration || 0), 0);

        const totalDuration = host1Duration + host2Duration;
        const host1Percentage = totalDuration > 0 ? (host1Duration / totalDuration) * 100 : 0;
        const host2Percentage = totalDuration > 0 ? (host2Duration / totalDuration) * 100 : 0;
        const imbalancePercentage = Math.abs(host1Percentage - host2Percentage);

        return {
            host1Duration,
            host2Duration,
            host1Percentage,
            host2Percentage,
            imbalancePercentage
        };
    }

    /**
     * Detects conversation flow issues
     */
    private detectConversationFlowIssues(script: PodcastScript): string[] {
        const issues: string[] = [];

        // Check for excessive consecutive segments by same speaker
        let consecutiveCount = 1;
        let currentSpeaker = script.segments[0]?.speaker;

        for (let i = 1; i < script.segments.length; i++) {
            if (script.segments[i].speaker === currentSpeaker) {
                consecutiveCount++;
                if (consecutiveCount > 3) {
                    issues.push(`Too many consecutive segments by ${currentSpeaker} (${consecutiveCount} in a row)`);
                    break;
                }
            } else {
                consecutiveCount = 1;
                currentSpeaker = script.segments[i].speaker;
            }
        }

        // Check for abrupt topic changes without transitions - simplified validation
        let transitionIssues = 0;
        for (let i = 1; i < script.segments.length; i++) {
            const currentSegment = script.segments[i];
            const previousSegment = script.segments[i - 1];

            if (currentSegment.speaker !== previousSegment.speaker) {
                const hasTransition = this.hasNaturalTransition(currentSegment.content, previousSegment.content);
                if (!hasTransition && i > 1) { // Allow first speaker change without transition
                    transitionIssues++;
                }
            }
        }

        // Only report transition issues if there are too many (more than 50% of transitions)
        if (transitionIssues > script.segments.length * 0.5) {
            issues.push(`${transitionIssues} segments lack natural transitions from previous speaker`);
        }

        return issues;
    }

    /**
     * Detects content quality issues
     */
    private detectContentQualityIssues(script: PodcastScript): string[] {
        const issues: string[] = [];

        // Check for repetitive content
        const contentSimilarity = this.detectRepetitiveContent(script);
        if (contentSimilarity.length > 0) {
            issues.push(...contentSimilarity);
        }

        // Check for overly formal or robotic language
        const formalityIssues = this.detectFormalityIssues(script);
        if (formalityIssues.length > 0) {
            issues.push(...formalityIssues);
        }

        // Check for missing conversational elements
        const conversationalIssues = this.detectMissingConversationalElements(script);
        if (conversationalIssues.length > 0) {
            issues.push(...conversationalIssues);
        }

        return issues;
    }

    /**
     * Checks if content has natural transitions
     */
    private hasNaturalTransition(currentContent: string, previousContent: string): boolean {
        const transitionWords = [
            'that\'s', 'exactly', 'absolutely', 'right', 'building', 'yes', 'well',
            'actually', 'interesting', 'great', 'good', 'sure', 'definitely',
            'i think', 'you know', 'speaking of', 'on that note'
        ];

        const firstWords = currentContent.toLowerCase().split(' ').slice(0, 3).join(' ');
        return transitionWords.some(word => firstWords.includes(word));
    }

    /**
     * Detects repetitive content in the script
     */
    private detectRepetitiveContent(script: PodcastScript): string[] {
        const issues: string[] = [];
        const contentPhrases: string[] = [];

        script.segments.forEach((segment, index) => {
            const phrases = segment.content.toLowerCase().split(/[.!?]+/).map(p => p.trim());

            phrases.forEach(phrase => {
                if (phrase.length > 20) { // Only check substantial phrases
                    const similarity = contentPhrases.find(existing =>
                        this.calculateStringSimilarity(phrase, existing) > 0.8
                    );

                    if (similarity) {
                        issues.push(`Segment ${index + 1} contains repetitive content similar to earlier segments`);
                    } else {
                        contentPhrases.push(phrase);
                    }
                }
            });
        });

        return issues;
    }

    /**
     * Detects overly formal language
     */
    private detectFormalityIssues(script: PodcastScript): string[] {
        const issues: string[] = [];
        const formalIndicators = [
            'furthermore', 'moreover', 'consequently', 'therefore', 'thus',
            'in conclusion', 'to summarize', 'in summary', 'henceforth'
        ];

        script.segments.forEach((segment, index) => {
            const content = segment.content.toLowerCase();
            const formalCount = formalIndicators.filter(indicator => content.includes(indicator)).length;

            if (formalCount > 1) {
                issues.push(`Segment ${index + 1} uses overly formal language, may sound robotic`);
            }
        });

        return issues;
    }

    /**
     * Detects missing conversational elements
     */
    private detectMissingConversationalElements(script: PodcastScript): string[] {
        const issues: string[] = [];
        const conversationalElements = [
            'you know', 'i think', 'actually', 'really', 'that\'s interesting',
            'great point', 'exactly', 'absolutely', 'right', 'well'
        ];

        const totalContent = script.segments.map(s => s.content.toLowerCase()).join(' ');
        const elementCount = conversationalElements.filter(element =>
            totalContent.includes(element)
        ).length;

        if (elementCount < 3) {
            issues.push('Script lacks natural conversational elements, may sound too formal');
        }

        return issues;
    }

    /**
     * Calculates string similarity using simple algorithm
     */
    private calculateStringSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.calculateEditDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Calculates edit distance between two strings
     */
    private calculateEditDistance(str1: string, str2: string): number {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1, // deletion
                    matrix[j - 1][i] + 1, // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Validates and fixes segment order
     */
    private validateAndFixSegmentOrder(script: PodcastScript): PodcastScript {
        const fixedSegments = script.segments
            .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
            .map((segment, index) => ({
                ...segment,
                sequenceOrder: index
            }));

        return {
            ...script,
            segments: fixedSegments
        };
    }

    /**
     * Generates expansion content specifically for balancing speaking time
     */
    private generateBalancingExpansion(content: string, speaker: 'host1' | 'host2'): string {
        const balancingExpansions = {
            host1: [
                "That's fascinating. I'd love to hear more about the practical implications.",
                "This is really important for our listeners to understand.",
                "Can you walk us through how this works in real-world scenarios?",
                "I think this connects to what we discussed earlier about the broader context."
            ],
            host2: [
                "Let me elaborate on that with a specific example that might help clarify.",
                "To build on that point, there are several key factors to consider here.",
                "This is particularly relevant because it affects how we approach the problem.",
                "What's interesting is how this principle applies across different situations."
            ]
        };

        const options = balancingExpansions[speaker];
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Condenses content specifically for balancing (more aggressive than general condensing)
     */
    private condenseForBalance(content: string): string {
        return content
            // Remove filler words and phrases
            .replace(/\b(you know|actually|basically|essentially|really|very|quite|just|like|sort of|kind of)\b/gi, '')
            // Remove redundant phrases
            .replace(/\b(I think that|I believe that|it seems that|it appears that)\b/gi, '')
            // Simplify complex phrases
            .replace(/\bin order to\b/gi, 'to')
            .replace(/\bdue to the fact that\b/gi, 'because')
            .replace(/\bat this point in time\b/gi, 'now')
            // Clean up extra spaces
            .replace(/\s+/g, ' ')
            .trim();
    }
}

// Export singleton instance
export const podcastService = new PodcastService();