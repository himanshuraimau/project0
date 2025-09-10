/**
 * Environment configuration and validation
 * Centralizes all environment variable handling with proper validation
 * Requirements: All requirements - environment setup
 */

import { z } from 'zod';

// Environment variable schema for validation
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // Authentication (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().default('/'),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().default('/'),
  
  // AI Services
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'Google AI API key is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  
  // AI Model Configuration
  EMBEDDING_MODEL: z.string().default('models/gemini-embedding-001'),
  CHAT_MODEL: z.string().default('models/gemini-2.5-flash'),
  EMBEDDING_DIM: z.coerce.number().default(1536),
  
  // Podcast Generation (ElevenLabs)
  ELEVENLABS_API_KEY: z.string().min(1, 'ElevenLabs API key is required for podcast generation'),
  ELEVENLABS_BASE_URL: z.string().url().default('https://api.elevenlabs.io/v1'),
  
  // Storage (Vercel Blob)
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'Vercel Blob token is required for audio storage'),
  
  // External APIs
  UNSPLASH_API_KEY: z.string().min(1, 'Unsplash API key is required'),
  YOUTUBE_API_KEY: z.string().min(1, 'YouTube API key is required'),
  SCRAPPER_API_KEY: z.string().min(1, 'Scrapper API key is required'),
  SCRAPE_DO_API_TOKEN: z.string().min(1, 'Scrape.do API token is required'),
  
  // Payment Processing (Dodo Payments)
  DODO_PAYMENTS_API_KEY: z.string().min(1, 'Dodo Payments API key is required'),
  DODO_PAYMENTS_WEBHOOK_KEY: z.string().min(1, 'Dodo Payments webhook key is required'),
  DODO_PAYMENTS_RETURN_URL: z.string().url('Invalid Dodo Payments return URL'),
  DODO_PAYMENTS_ENVIRONMENT: z.enum(['test_mode', 'live_mode']).default('test_mode'),
  NEXT_PUBLIC_DODO_PRODUCT_ID_PRO: z.string().min(1, 'Dodo Pro product ID is required'),
  NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE: z.string().min(1, 'Dodo Enterprise product ID is required'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
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
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      console.error('❌ Environment configuration error:');
      
      if (missingVars.length > 0) {
        console.error('\n📋 Missing required environment variables:');
        missingVars.forEach(varName => {
          console.error(`  - ${varName}`);
        });
      }
      
      if (invalidVars.length > 0) {
        console.error('\n⚠️  Invalid environment variables:');
        invalidVars.forEach(error => {
          console.error(`  - ${error}`);
        });
      }
      
      console.error('\n💡 Please check your .env file and ensure all required variables are set correctly.');
      
      // In development, provide helpful setup instructions
      if (process.env.NODE_ENV === 'development') {
        console.error('\n🔧 Setup instructions:');
        console.error('  1. Copy .env.example to .env.local');
        console.error('  2. Fill in all required API keys and configuration values');
        console.error('  3. Restart your development server');
        console.error('\n📚 See README.md for detailed setup instructions.');
      }
      
      throw new Error('Environment configuration validation failed');
    }
    throw error;
  }
}

// Export validated environment configuration
export const env = parseEnvironment();

// Environment-specific configurations
export const config = {
  // Database
  database: {
    url: env.DATABASE_URL,
  },
  
  // Authentication
  auth: {
    clerk: {
      publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: env.CLERK_SECRET_KEY,
      signInUrl: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      signUpUrl: env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      signInFallbackUrl: env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
      signUpFallbackUrl: env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
    },
  },
  
  // AI Services
  ai: {
    google: {
      apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
      embeddingModel: env.EMBEDDING_MODEL,
      chatModel: env.CHAT_MODEL,
      embeddingDimension: env.EMBEDDING_DIM,
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
    },
  },
  
  // Podcast Generation
  podcast: {
    elevenlabs: {
      apiKey: env.ELEVENLABS_API_KEY,
      baseUrl: env.ELEVENLABS_BASE_URL,
    },
    storage: {
      blobToken: env.BLOB_READ_WRITE_TOKEN,
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
      apiKey: env.UNSPLASH_API_KEY,
    },
    youtube: {
      apiKey: env.YOUTUBE_API_KEY,
    },
    scrapper: {
      apiKey: env.SCRAPPER_API_KEY,
    },
    scrapeDo: {
      token: env.SCRAPE_DO_API_TOKEN,
    },
  },
  
  // Payments
  payments: {
    dodo: {
      apiKey: env.DODO_PAYMENTS_API_KEY,
      webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
      returnUrl: env.DODO_PAYMENTS_RETURN_URL,
      environment: env.DODO_PAYMENTS_ENVIRONMENT,
      products: {
        pro: env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO,
        enterprise: env.NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE,
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
      if (!config.podcast.elevenlabs.apiKey.includes('sk_')) {
        missing.push('ElevenLabs API key (ELEVENLABS_API_KEY)');
      }
      if (!config.podcast.storage.blobToken || config.podcast.storage.blobToken.includes('placeholder')) {
        missing.push('Vercel Blob token (BLOB_READ_WRITE_TOKEN)');
      }
    }
    
    // Check AI service requirements
    if (!config.ai.openai.apiKey.includes('sk-')) {
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
        elevenlabs: !!config.podcast.elevenlabs.apiKey && !config.podcast.elevenlabs.apiKey.includes('placeholder'),
        openai: !!config.ai.openai.apiKey && config.ai.openai.apiKey.startsWith('sk-'),
        vercelBlob: !!config.podcast.storage.blobToken && !config.podcast.storage.blobToken.includes('placeholder'),
        clerk: !!config.auth.clerk.publishableKey && !!config.auth.clerk.secretKey,
      },
    };
  },
};

// Export types for TypeScript
export type Environment = typeof env;
export type Config = typeof config;
export type FeatureFlag = keyof typeof config.features;

// Development helper to log configuration status
if (config.isDevelopment) {
  const summary = environmentUtils.getConfigSummary();
  const validation = environmentUtils.validateServiceConfiguration();
  
  console.log('🔧 Environment Configuration Summary:');
  console.log(`   Environment: ${summary.environment}`);
  console.log(`   Features: ${Object.entries(summary.features).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`   Services: ${Object.entries(summary.services).map(([k, v]) => `${k}=${v ? '✅' : '❌'}`).join(', ')}`);
  
  if (!validation.valid) {
    console.warn('⚠️  Missing configuration:', validation.missing.join(', '));
  }
}