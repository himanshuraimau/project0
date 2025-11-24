import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getToken } from '@/lib/auth';

// Base API URL - adjust this based on your environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Store a reference to the Clerk getToken function
let clerkGetToken: (() => Promise<string | null>) | null = null;

// Function to set the Clerk token getter
export const setClerkTokenGetter = (getter: () => Promise<string | null>) => {
  clerkGetToken = getter;
};
console.log('🔗 API Client Configuration:');
console.log('📍 Base URL:', API_BASE_URL);
console.log('🌐 Environment API URL:', process.env.EXPO_PUBLIC_API_URL);

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log('📤 Making API Request:');
    console.log('🎯 URL:', `${config.baseURL || 'undefined'}${config.url || 'undefined'}`);
    console.log('🔧 Method:', config.method?.toUpperCase());
    console.log('📝 Headers:', config.headers);

    try {
      // Try to get Clerk token first
      if (clerkGetToken) {
        const token = await clerkGetToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // Fallback to SecureStore (for backward compatibility)
        const token = await SecureStore.getItemAsync('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

      }
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:');
    console.log('✅ Status:', response.status);
    console.log('📊 Data:', response.data);
    return response;
  },
  async (error: AxiosError) => {
    console.error('❌ API Error:', error);

    if (error.response) {
      console.error('🚨 Response Error Details:');
      console.error('📊 Status:', error.response.status);
      console.error('📝 Data:', error.response.data);
      console.error('🎯 URL:', error.config?.url);

      // Server responded with error status
      const status = error.response.status;

      switch (status) {
        case 401:
          console.log('🔐 Unauthorized - token may be invalid or expired');
          // Note: With Clerk, we don't manually manage tokens
          // The token provider should handle refreshing automatically
          break;
        case 403:
          console.error('🚫 Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('🔍 Resource not found');
          break;
        case 500:
          console.error('💥 Server error');
          break;
        case 503:
          console.error('🚧 Service unavailable');
          break;
      }
    } else if (error.request) {
      console.error('🌐 Network error - no response received');
      console.error('📡 Request details:', error.request);
    } else {
      console.error('⚙️ Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API responses
export const handleApiResponse = <T>(response: any): T => {
  console.log('🔍 handleApiResponse called');
  console.log('📊 Response object:', response);
  console.log('📝 Response data:', response.data);

  if (response.data.success) {
    console.log('✅ Response marked as successful');
    console.log('🎯 Returning data:', response.data.data);
    return response.data.data as T;
  }

  console.error('❌ Response not marked as successful');
  console.error('💬 Error message:', response.data.message);
  throw new Error(response.data.message || 'API request failed');
};

// Helper function to handle API errors
export const handleApiError = (error: any): never => {
  console.error('🔥 handleApiError called with:', error);
  if (isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    console.error('🎯 Axios error message:', message);
    console.error('📊 Status code:', statusCode);
    console.error('📦 Error data:', errorData);

    // Create enhanced error with additional fields
    const enhancedError: any = new Error(message);
    enhancedError.statusCode = statusCode;
    enhancedError.notesUsed = errorData?.notesUsed;
    enhancedError.notesLimit = errorData?.notesLimit;
    enhancedError.upgradeUrl = errorData?.upgradeUrl;

    throw enhancedError;
  }
  console.error('🔥 Non-Axios error:', error);
  throw error;
};

export default apiClient;
