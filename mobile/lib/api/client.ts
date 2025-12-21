import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, isAxiosError } from 'axios';

// Base API URL - adjust this based on your environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Store a reference to the token getter function
let tokenProvider: (() => string | null | Promise<string | null>) | null = null;

// Function to set the token provider (called by AuthTokenProvider)
export const setTokenProvider = (getter: () => string | null | Promise<string | null>) => {
  tokenProvider = getter;
};

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
  withCredentials: true,
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  maxContentLength: 50 * 1024 * 1024, // 50MB
});

// Request interceptor to add auth cookies
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Handle FormData requests specially
      if (config.data instanceof FormData) {
        if (__DEV__) {
          console.log('🔧 Handling FormData request');
        }
        
        // For React Native, we need to explicitly set multipart/form-data
        // React Native doesn't auto-generate the boundary like browsers do
        if (config.headers) {
          // Set the Content-Type to multipart/form-data
          // React Native's networking layer will add the boundary parameter
          config.headers['Content-Type'] = 'multipart/form-data';
          
          if (__DEV__) {
            console.log('📄 Content-Type set to multipart/form-data');
          }
        }
      } else if (config.headers && !config.headers['Content-Type']) {
        // For other requests, default to JSON
        config.headers['Content-Type'] = 'application/json';
      }

      // Get cookies from Better Auth
      if (tokenProvider) {
        const cookies = await tokenProvider();
        if (cookies && config.headers) {
          config.headers.Cookie = cookies;
        }
      }
    } catch (error) {
      if (__DEV__) console.log('❌ Error getting auth cookies:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    if (__DEV__) console.log('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // Log error for debugging in development
    if (__DEV__) {
      console.log('❌ API Error:', error);

      if (error.response) {
        console.log('🚨 Response Error Details:');
        console.log('📊 Status:', error.response.status);
        console.log('📝 Data:', error.response.data);
        console.log('🎯 URL:', error.config?.url);
      } else if (error.request) {
        console.log('🌐 Network error - no response received');
        console.log('📡 Request details:', error.request);
      } else {
        console.log('⚙️ Request setup error:', error.message);
      }
    }

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          if (__DEV__) console.log('🔐 Unauthorized - session may be invalid or expired');
          break;
        case 403:
          if (__DEV__) console.log('🚫 Forbidden - insufficient permissions');
          break;
        case 404:
          if (__DEV__) console.log('🔍 Resource not found');
          break;
        case 500:
          if (__DEV__) console.log('💥 Server error');
          break;
        case 503:
          if (__DEV__) console.log('🚧 Service unavailable');
          break;
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API responses
export const handleApiResponse = <T>(response: any): T => {
  if (response.data.success) {
    return response.data.data as T;
  }

  if (__DEV__) {
    console.log('❌ Response not marked as successful');
    console.log('💬 Error message:', response.data.message);
  }
  throw new Error(response.data.message || 'API request failed');
};

// Helper function to handle API errors
export const handleApiError = (error: any): never => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    if (statusCode && statusCode !== 404 && __DEV__) {
      console.log('🔥 API Error:', message, `(${statusCode})`);
    }

    const enhancedError: any = new Error(message);
    enhancedError.statusCode = statusCode;
    enhancedError.notesUsed = errorData?.notesUsed;
    enhancedError.notesLimit = errorData?.notesLimit;
    enhancedError.upgradeUrl = errorData?.upgradeUrl;

    throw enhancedError;
  }
  throw error;
};

export default apiClient;