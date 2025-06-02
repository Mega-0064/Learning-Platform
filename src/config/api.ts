/**
 * API Configuration
 * 
 * Central configuration for API endpoints and settings.
 * Uses environment variables for different environments.
 */

// Base API URL from environment variables with fallback
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.learning-platform.com/v1';

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  ME: '/auth/me',
  // Social login endpoints
  GOOGLE_AUTH: '/auth/google',
  FACEBOOK_AUTH: '/auth/facebook',
};

// User endpoints
export const USER_ENDPOINTS = {
  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  UPLOAD_AVATAR: '/users/avatar',
};

// Course endpoints
export const COURSE_ENDPOINTS = {
  LIST: '/courses',
  DETAILS: (id: string) => `/courses/${id}`,
  ENROLL: (id: string) => `/courses/${id}/enroll`,
  MY_COURSES: '/courses/enrolled',
};

// Request timeouts in milliseconds
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Default request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * API Environments
 * 
 * Used to switch between different API environments
 * (development, staging, production)
 */
export enum ApiEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Get environment-specific configuration
 */
export const getApiConfig = (environment: ApiEnvironment = ApiEnvironment.DEVELOPMENT) => {
  switch (environment) {
    case ApiEnvironment.PRODUCTION:
      return {
        baseUrl: process.env.REACT_APP_PROD_API_URL || API_BASE_URL,
        timeout: REQUEST_TIMEOUT,
      };
    case ApiEnvironment.STAGING:
      return {
        baseUrl: process.env.REACT_APP_STAGING_API_URL || API_BASE_URL,
        timeout: REQUEST_TIMEOUT,
      };
    case ApiEnvironment.DEVELOPMENT:
    default:
      return {
        baseUrl: process.env.REACT_APP_DEV_API_URL || API_BASE_URL,
        timeout: REQUEST_TIMEOUT,
      };
  }
};

// Export current environment configuration
export const currentApiConfig = getApiConfig(
  (process.env.REACT_APP_ENV as ApiEnvironment) || ApiEnvironment.DEVELOPMENT
);

