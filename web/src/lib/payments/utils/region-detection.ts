/**
 * Region Detection Utilities for Payment Methods
 * 
 * Helps detect user's region for enabling appropriate payment methods
 * like UPI and Google Pay for India.
 */

type PaymentRegion = 'IN' | 'US' | 'EU' | 'DEFAULT';

// Indian phone number pattern: starts with +91 or 91, followed by 10 digits
const INDIA_PHONE_REGEX = /^(?:\+?91)?[6-9]\d{9}$/;

// Indian pincode pattern: 6 digits
const INDIA_PINCODE_REGEX = /^\d{6}$/;

/**
 * Detect region from phone number
 */
export function detectRegionFromPhone(phoneNumber: string): PaymentRegion | undefined {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (INDIA_PHONE_REGEX.test(cleaned)) {
    return 'IN';
  }
  
  // US phone numbers (simplified check)
  if (cleaned.startsWith('+1') || (cleaned.length === 10 && /^\d{10}$/.test(cleaned))) {
    return 'US';
  }
  
  return undefined;
}

/**
 * Detect if zipcode is an Indian pincode
 */
export function isIndianPincode(zipcode: string): boolean {
  return INDIA_PINCODE_REGEX.test(zipcode.trim());
}

/**
 * Format phone number for India (ensure +91 prefix)
 */
export function formatIndianPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return '+91' + cleaned;
  }
  
  return phoneNumber;
}

/**
 * Get payment region configuration for checkout
 */
export function getPaymentRegionConfig(region: PaymentRegion) {
  switch (region) {
    case 'IN':
      return {
        currency: 'INR',
        currencySymbol: '₹',
        country: 'IN',
        paymentMethodsLabel: 'UPI, Google Pay, Cards',
        requiresPhone: true,
      };
    case 'US':
      return {
        currency: 'USD',
        currencySymbol: '$',
        country: 'US',
        paymentMethodsLabel: 'Cards, Apple Pay, Google Pay',
        requiresPhone: false,
      };
    default:
      return {
        currency: 'USD',
        currencySymbol: '$',
        country: undefined,
        paymentMethodsLabel: 'Cards, Google Pay',
        requiresPhone: false,
      };
  }
}

/**
 * Validate phone number for UPI payments
 * UPI requires a valid Indian mobile number
 */
export function validateIndianPhoneForUPI(phoneNumber: string): { valid: boolean; error?: string } {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (!cleaned) {
    return { valid: false, error: 'Phone number is required for UPI payments' };
  }
  
  // Remove +91 or 91 prefix for validation
  let number = cleaned;
  if (number.startsWith('+91')) {
    number = number.slice(3);
  } else if (number.startsWith('91') && number.length === 12) {
    number = number.slice(2);
  }
  
  if (number.length !== 10) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number' };
  }
  
  if (!/^[6-9]\d{9}$/.test(number)) {
    return { valid: false, error: 'Indian mobile numbers must start with 6, 7, 8, or 9' };
  }
  
  return { valid: true };
}
