/**
 * Common types and utility interfaces shared across the application
 */

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserContext {
  userId: string | null;
  isAuthenticated: boolean;
}

export interface CreditError extends Error {
  redirectToPricing?: boolean;
  redirectUrl?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: unknown;
}

export interface QueryParams extends PaginationParams, SortParams, FilterParams {}

export type EntityStatus = 'active' | 'inactive' | 'pending' | 'archived';

export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOwnedEntity {
  userId: string | null;
}

export interface NamedEntity {
  name: string;
  description?: string;
}