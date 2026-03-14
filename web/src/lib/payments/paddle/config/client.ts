import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { PADDLE_CONFIG } from './constants';

let paddleInstance: Paddle | null = null;

export function getPaddleClient(): Paddle {
  if (!paddleInstance) {
    if (!PADDLE_CONFIG.apiKey) {
      throw new Error('PADDLE_API_KEY environment variable is required');
    }

    paddleInstance = new Paddle(PADDLE_CONFIG.apiKey, {
      environment: PADDLE_CONFIG.environment === 'production'
        ? Environment.production
        : Environment.sandbox,
    });
  }

  return paddleInstance;
}
