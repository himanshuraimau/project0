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
  
  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  
  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_BASE_URL: z.string().default('https://api.elevenlabs.io/v1'),
  ELEVEN_LABS_WEBHOOK_SERCRET: z.string().optional(),
  ELEVENLABS_CALLBACK_URL: z.string().optional(),
  
  // AI Model Configuration
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  CHAT_MODEL: z.string().default('gpt-5-mini'),
  EMBEDDING_DIM: z.coerce.number().default(1536),
  

  
  // Storage (Vercel Blob) - Optional for local development
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  
  // External APIs
  UNSPLASH_API_KEY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  SCRAPPER_API_KEY: z.string().optional(),
  SCRAPE_DO_API_TOKEN: z.string().optional(),
  
  // Payment Processing (Paddle)
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_WEBHOOK_SECRET: z.string().optional(),
  PADDLE_RETURN_URL: z.string().optional(),
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID: z.string().optional(),
  NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  
  // Optional feature flags

  ENABLE_COURSE_GENERATION: z.coerce.boolean().default(true),
  ENABLE_ANALYTICS: z.coerce.boolean().default(true),
  
  // Rate limiting and quotas

  MAX_AUDIO_FILE_SIZE_MB: z.coerce.number().default(50),
  MAX_TRANSCRIPT_LENGTH: z.coerce.number().default(50000),
});

// Parse and validate environment variables
function parseEnvironment() {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Production environment checks
    if (parsed.NODE_ENV === 'production') {
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
  
  // AI Services
  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY || '',
      embeddingModel: env.EMBEDDING_MODEL,
      chatModel: env.CHAT_MODEL,
      embeddingDimension: env.EMBEDDING_DIM,
    },
    elevenlabs: {
      apiKey: env.ELEVENLABS_API_KEY || '',
      baseUrl: env.ELEVENLABS_BASE_URL,
      webhookSecret: env.ELEVEN_LABS_WEBHOOK_SERCRET || '',
      callbackUrl: env.ELEVENLABS_CALLBACK_URL || `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/podcast/callback`,
    },
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
    paddle: {
      apiKey: env.PADDLE_API_KEY || '',
      webhookSecret: env.PADDLE_WEBHOOK_SECRET || '',
      returnUrl: env.PADDLE_RETURN_URL || '',
      clientToken: env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
      environment: env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
      prices: {
        monthly: env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || '',
        yearly: env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID || '',
      },
    },
  },
  
  // Feature flags
  features: {

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
      case 'openai':
        return config.ai.openai.apiKey;
      case 'elevenlabs':
        return config.ai.elevenlabs.apiKey;
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

        openai: !!config.ai.openai.apiKey && config.ai.openai.apiKey.startsWith('sk-'),
        elevenlabs: !!config.ai.elevenlabs.apiKey && config.ai.elevenlabs.apiKey.startsWith('sk_'),
        localStorage: true, // Using local storage for development
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