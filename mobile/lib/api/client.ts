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
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
  maxBodyLength: 50 * 1024 * 1024, // 50MB - Allow large file uploads (audio, PDF, etc.)
  maxContentLength: 50 * 1024 * 1024, // 50MB - Allow large responses
});

// Request interceptor to add auth cookies
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get cookies from Better Auth
      if (tokenProvider) {
        const cookies = await tokenProvider();
        if (cookies && config.headers) {
          config.headers.Cookie = cookies;
        }
      }
    } catch (error) {
      console.error('❌ Error getting auth cookies:', error);
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
          console.log('🔐 Unauthorized - session may be invalid or expired');
          // Better Auth handles session refresh automatically
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
  if (response.data.success) {
    return response.data.data as T;
  }

  console.error('❌ Response not marked as successful');
  console.error('💬 Error message:', response.data.message);
  throw new Error(response.data.message || 'API request failed');
};

// Helper function to handle API errors
export const handleApiError = (error: any): never => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    // Only log detailed errors for unexpected status codes (not 404)
    if (statusCode && statusCode !== 404) {
      console.error('🔥 API Error:', message, `(${statusCode})`);
    }

    // Create enhanced error with additional fields
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
