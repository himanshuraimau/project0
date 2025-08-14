/**
 * Standardized API request and response types
 */

// Base API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Success response
export interface ApiSuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
}

// Error response with redirection support
export interface ApiErrorResponse extends ApiResponse {
  success: false;
  error: string;
  redirectToPricing?: boolean;
  redirectUrl?: string;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// API Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface CreditError extends ApiError {
  redirectToPricing: boolean;
  redirectUrl?: string;
}

export interface ValidationError extends ApiError {
  field: string;
  value: unknown;
}

// Request types
export interface BaseApiRequest {
  userId?: string;
}

export interface PaginatedRequest extends BaseApiRequest {
  page?: number;
  limit?: number;
}

export interface SearchRequest extends PaginatedRequest {
  query: string;
  filters?: Record<string, unknown>;
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API endpoint configuration
export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  requiresAuth?: boolean;
}

// Request options
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// File upload types
export interface FileUploadRequest extends BaseApiRequest {
  file: File;
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}