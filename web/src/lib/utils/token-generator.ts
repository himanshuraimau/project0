import crypto from 'crypto';

export class TokenGenerator {
  /**
   * Generate a cryptographically secure URL-safe token
   */
  static generateShareToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate a short, user-friendly share ID
   */
  static generateShareId(): string {
    return crypto.randomBytes(8).toString('base64url');
  }

  /**
   * Validate token format (43 characters, base64url)
   */
  static isValidToken(token: string): boolean {
    return /^[A-Za-z0-9_-]{43}$/.test(token);
  }
}
