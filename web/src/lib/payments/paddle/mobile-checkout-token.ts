import crypto from 'crypto';

export type MobileCheckoutTokenPayload = {
  priceId: string;
  customerEmail: string;
  customData: { userId: string; revenuecat_app_user_id?: string };
  environment: string;
  clientToken: string;
  discountCode?: string;
  successUrl: string;
  cancelUrl: string;
  exp: number;
  iat: number;
};

const DEFAULT_TTL_SECONDS = 10 * 60;

function getSigningSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET or PADDLE_WEBHOOK_SECRET must be configured');
  }
  return secret;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf-8');
}

function signPayload(encodedPayload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function isValidSignature(encodedPayload: string, providedSignature: string, secret: string): boolean {
  const expected = signPayload(encodedPayload, secret);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export function createMobileCheckoutToken(
  payload: Omit<MobileCheckoutTokenPayload, 'exp' | 'iat'>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): string {
  const now = Math.floor(Date.now() / 1000);
  const signedPayload: MobileCheckoutTokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(signedPayload));
  const signature = signPayload(encodedPayload, getSigningSecret());
  return `${encodedPayload}.${signature}`;
}

export function verifyMobileCheckoutToken(token: string): MobileCheckoutTokenPayload {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    throw new Error('Invalid mobile checkout token format');
  }

  if (!isValidSignature(encodedPayload, signature, getSigningSecret())) {
    throw new Error('Invalid mobile checkout token signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as MobileCheckoutTokenPayload;
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    throw new Error('Mobile checkout token expired');
  }

  return payload;
}
