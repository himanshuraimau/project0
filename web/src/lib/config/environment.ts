/**
 * Environment configuration and validation
 * Centralizes all environment variable handling with proper validation
 * Requirements: All requirements - environment setup
 */

import { z } from 'zod';

// Environment variable schema for validation
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().optional(),
  
  // Authentication (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().default('/'),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().default('/'),
  
  // AI Services
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  
  // AI Model Configuration
  EMBEDDING_MODEL: z.string().default('models/gemini-embedding-001'),
  CHAT_MODEL: z.string().default('models/gemini-2.5-flash'),
  EMBEDDING_DIM: z.coerce.number().default(1536),
  
  // Podcast Generation (ElevenLabs)
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_BASE_URL: z.string().default('https://api.elevenlabs.io/v1'),
  
  // Storage (Vercel Blob) - Optional for local development
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  
  // External APIs
  UNSPLASH_API_KEY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  SCRAPPER_API_KEY: z.string().optional(),
  SCRAPE_DO_API_TOKEN: z.string().optional(),
  
  // Payment Processing (Dodo Payments)
  DODO_PAYMENTS_API_KEY: z.string().optional(),
  DODO_PAYMENTS_WEBHOOK_KEY: z.string().optional(),
  DODO_PAYMENTS_RETURN_URL: z.string().optional(),
  DODO_PAYMENTS_ENVIRONMENT: z.enum(['test_mode', 'live_mode']).default('test_mode'),
  NEXT_PUBLIC_DODO_PRODUCT_ID_PRO: z.string().optional(),
  NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  
  // Optional feature flags
  ENABLE_PODCAST_GENERATION: z.coerce.boolean().default(true),
  ENABLE_COURSE_GENERATION: z.coerce.boolean().default(true),
  ENABLE_ANALYTICS: z.coerce.boolean().default(true),
  
  // Rate limiting and quotas
  MAX_PODCAST_GENERATIONS_PER_DAY: z.coerce.number().default(10),
  MAX_AUDIO_FILE_SIZE_MB: z.coerce.number().default(50),
  MAX_TRANSCRIPT_LENGTH: z.coerce.number().default(50000),
});

// Parse and validate environment variables
function parseEnvironment() {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Production environment checks
    if (parsed.NODE_ENV === 'production') {
      // Check for development keys in production
      if (parsed.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('pk_test_')) {
        console.warn('⚠️  WARNING: Using Clerk development keys in production environment!');
        console.warn('Please update to production keys: https://clerk.com/docs/deployments/overview');
      }
      
      // Check for localhost URLs in production
      if (parsed.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
        console.warn('⚠️  WARNING: Using localhost URL in production environment!');
        console.warn('Please set NEXT_PUBLIC_APP_URL to your production domain');
      }
      
      // Check if required production variables are set
      if (!parsed.NEXT_PUBLIC_APP_URL) {
        console.warn('⚠️  WARNING: NEXT_PUBLIC_APP_URL not set in production');
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('Environment configuration error:', error);
    
    // In development, provide helpful setup instructions
    if (process.env.NODE_ENV === 'development') {
      console.error('Please check your .env file and ensure all required variables are set correctly.');
    }
    
    throw new Error('Environment configuration validation failed');
  }
}

// Export validated environment configuration
export const env = parseEnvironment();

// Environment-specific configurations
export const config = {
  // Database
  database: {
    url: env.DATABASE_URL || '',
  },
  
  // Authentication
  auth: {
    clerk: {
      publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      secretKey: env.CLERK_SECRET_KEY || '',
      signInUrl: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      signUpUrl: env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      signInFallbackUrl: env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
      signUpFallbackUrl: env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
    },
  },
  
  // AI Services
  ai: {
    google: {
      apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY || '',
      embeddingModel: env.EMBEDDING_MODEL,
      chatModel: env.CHAT_MODEL,
      embeddingDimension: env.EMBEDDING_DIM,
    },
    openai: {
      apiKey: env.OPENAI_API_KEY || '',
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY || '',
    },
  },
  
  // Podcast Generation
  podcast: {
    elevenlabs: {
      apiKey: env.ELEVENLABS_API_KEY || '',
      baseUrl: env.ELEVENLABS_BASE_URL,
    },
    storage: {
      blobToken: env.BLOB_READ_WRITE_TOKEN || null,
    },
    limits: {
      maxGenerationsPerDay: env.MAX_PODCAST_GENERATIONS_PER_DAY,
      maxAudioFileSizeMB: env.MAX_AUDIO_FILE_SIZE_MB,
      maxTranscriptLength: env.MAX_TRANSCRIPT_LENGTH,
    },
    enabled: env.ENABLE_PODCAST_GENERATION,
  },
  
  // External APIs
  external: {
    unsplash: {
      apiKey: env.UNSPLASH_API_KEY || '',
    },
    youtube: {
      apiKey: env.YOUTUBE_API_KEY || '',
    },
    scrapper: {
      apiKey: env.SCRAPPER_API_KEY || '',
    },
    scrapeDo: {
      token: env.SCRAPE_DO_API_TOKEN || '',
    },
  },
  
  // Payments
  payments: {
    dodo: {
      apiKey: env.DODO_PAYMENTS_API_KEY || '',
      webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY || '',
      returnUrl: env.DODO_PAYMENTS_RETURN_URL || '',
      environment: env.DODO_PAYMENTS_ENVIRONMENT,
      products: {
        pro: env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || '',
        enterprise: env.NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE || '',
      },
    },
  },
  
  // Feature flags
  features: {
    podcastGeneration: env.ENABLE_PODCAST_GENERATION,
    courseGeneration: env.ENABLE_COURSE_GENERATION,
    analytics: env.ENABLE_ANALYTICS,
  },
  
  // Environment info
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  appUrl: env.NEXT_PUBLIC_APP_URL,
} as const;

// Utility functions for environment checks
export const environmentUtils = {
  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled: (feature: keyof typeof config.features): boolean => {
    return config.features[feature];
  },
  
  /**
   * Check if we're in a specific environment
   */
  isEnvironment: (environment: 'development' | 'production' | 'test'): boolean => {
    return env.NODE_ENV === environment;
  },
  
  /**
   * Get API key for a service (with validation)
   */
  getApiKey: (service: string): string => {
    switch (service) {
      case 'elevenlabs':
        return config.podcast.elevenlabs.apiKey;
      case 'openai':
        return config.ai.openai.apiKey;
      case 'google':
        return config.ai.google.apiKey;
      case 'unsplash':
        return config.external.unsplash.apiKey;
      case 'youtube':
        return config.external.youtube.apiKey;
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  },
  
  /**
   * Validate that all required services are configured
   */
  validateServiceConfiguration: (): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];
    
    // Check podcast generation requirements
    if (config.features.podcastGeneration) {
      if (!config.podcast.elevenlabs.apiKey || !config.podcast.elevenlabs.apiKey.includes('sk_')) {
        missing.push('ElevenLabs API key (ELEVENLABS_API_KEY)');
      }
    }
    
    // Check AI service requirements
    if (!config.ai.openai.apiKey || !config.ai.openai.apiKey.includes('sk-')) {
      missing.push('OpenAI API key (OPENAI_API_KEY)');
    }
    
    return {
      valid: missing.length === 0,
      missing,
    };
  },
  
  /**
   * Get configuration summary for debugging
   */
  getConfigSummary: () => {
    return {
      environment: env.NODE_ENV,
      features: config.features,
      services: {
        database: !!config.database.url,
        elevenlabs: !!config.podcast.elevenlabs.apiKey && config.podcast.elevenlabs.apiKey.startsWith('sk_'),
        openai: !!config.ai.openai.apiKey && config.ai.openai.apiKey.startsWith('sk-'),
        localStorage: true, // Using local storage for development
        clerk: !!config.auth.clerk.publishableKey && !!config.auth.clerk.secretKey,
      },
    };
  },
};

// Export types for TypeScript
export type Environment = typeof env;
export type Config = typeof config;
export type FeatureFlag = keyof typeof config.features;

// Simple development logging
if (config.isDevelopment) {
  console.log('Environment loaded:', config.isDevelopment ? 'development' : 'production');
}