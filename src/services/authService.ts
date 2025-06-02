import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  AuthResponseWithTokens, 
  ChangePasswordRequest, 
  ForgotPasswordRequest, 
  LoginCredentials, 
  PasswordResponse, 
  RefreshTokenRequest, 
  RegistrationData, 
  ResetPasswordRequest, 
  ResendVerificationRequest, 
  SocialAuthRequest, 
  TokenPair, 
  User, 
  VerificationRequest, 
  VerificationResponse 
} from '../types/auth';
import { 
  API_BASE_URL, 
  AUTH_ENDPOINTS, 
  DEFAULT_HEADERS, 
  REQUEST_TIMEOUT 
} from '../config/api';

/**
 * Authentication Service
 * 
 * Handles API requests related to authentication including:
 * - User registration
 * - User login
 * - Token management
 */
class AuthService {
  private api: AxiosInstance;
  
  // Token refresh timeout ID
  private refreshTimeoutId: number | null = null;
  
  // Authentication error types
  private errorTypes = {
    UNAUTHORIZED: 'Unauthorized',
    INVALID_CREDENTIALS: 'InvalidCredentials',
    ACCOUNT_LOCKED: 'AccountLocked',
    EMAIL_NOT_VERIFIED: 'EmailNotVerified',
    INVALID_TOKEN: 'InvalidToken',
    TOKEN_EXPIRED: 'TokenExpired',
    NETWORK_ERROR: 'NetworkError',
    SERVER_ERROR: 'ServerError',
    UNKNOWN_ERROR: 'UnknownError',
  };

  constructor() {
    // Create axios instance with base configuration
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: DEFAULT_HEADERS,
      timeout: REQUEST_TIMEOUT,
    });
    
    // Add request interceptor to include auth token in requests
    this.api.interceptors.request.use(
      async (config) => {
        const accessToken = this.getAccessToken();
        
        // If token exists, add to headers
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(this.createAuthError(error));
      }
    );
    
    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Check if we have a refresh token
          const refreshToken = this.getRefreshToken();
          
          if (refreshToken) {
            originalRequest._retry = true;
            
            try {
              // Try to refresh the token
              const tokens = await this.refreshTokens(refreshToken);
              
              // Update authorization header
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              }
              
              // Retry the original request
              return this.api(originalRequest);
            } catch (refreshError) {
              // If refresh token is invalid, clear tokens and force logout
              this.clearTokens();
              
              // Dispatch a custom event to notify the app about the session expiration
              window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
              
              return Promise.reject(this.createAuthError(refreshError as AxiosError, this.errorTypes.TOKEN_EXPIRED));
            }
          } else {
            // No refresh token, clear tokens and force logout
            this.clearTokens();
            
            // Dispatch a custom event to notify about unauthorized access
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
        }
        
        // Handle other specific error status codes
        if (error.response?.status === 403) {
          // Forbidden - user doesn't have permission
          window.dispatchEvent(new CustomEvent('auth:forbidden'));
        }
        
        return Promise.reject(this.createAuthError(error));
      }
    );
    
    // Initialize token refresh mechanism if we have tokens
    this.initTokenRefresh();
  }
  
  /**
   * Register a new user
   * @param userData Registration data including username, email, password, etc.
   * @returns Promise with user data and token
   */
  /**
   * Register a new user
   * @param userData Registration data including username, email, password, etc.
   * @returns Promise with registration response
   */
  async register(userData: RegistrationData): Promise<AuthResponseWithTokens> {
    try {
      const response = await this.api.post<AuthResponseWithTokens>(
        AUTH_ENDPOINTS.REGISTER, 
        userData
      );
      
      const { tokens, user } = response.data;
      
      // Store tokens securely
      this.setTokens(tokens);
      
      // Set up automatic token refresh
      this.setupTokenRefresh(tokens.expiresIn);
      
      return response.data;
    } catch (error) {
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Verify user's email address
   * @param verificationData Token received in verification email
   * @returns Promise with verification response
   */
  async verifyEmail(verificationData: VerificationRequest): Promise<VerificationResponse> {
    try {
      const response = await this.api.post<VerificationResponse>(
        AUTH_ENDPOINTS.VERIFY_EMAIL, 
        verificationData
      );
      
      return response.data;
    } catch (error) {
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Resend verification email
   * @param data Email address to resend verification to
   * @returns Promise with response message
   */
  async resendVerificationEmail(data: ResendVerificationRequest): Promise<VerificationResponse> {
    try {
      const response = await this.api.post<VerificationResponse>(
        AUTH_ENDPOINTS.RESEND_VERIFICATION, 
        data
      );
      
      return response.data;
    } catch (error) {
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Login an existing user
   * @param credentials Login credentials (email and password)
   * @returns Promise with user data and token
   */
  /**
   * Login an existing user
   * @param credentials Login credentials (email and password)
   * @returns Promise with user data and tokens
   */
  async login(credentials: LoginCredentials): Promise<AuthResponseWithTokens> {
    try {
      const response = await this.api.post<AuthResponseWithTokens>(
        AUTH_ENDPOINTS.LOGIN, 
        credentials
      );
      
      const { tokens, user } = response.data;
      
      // Store tokens securely
      this.setTokens(tokens);
      
      // Set up automatic token refresh
      this.setupTokenRefresh(tokens.expiresIn);
      
      return response.data;
    } catch (error) {
      // Handle specific login errors
      const axiosError = error as AxiosError;
      
      // Check for email not verified error
      if (axiosError.response?.status === 403 && 
          axiosError.response.data && 
          (axiosError.response.data as any).code === 'EMAIL_NOT_VERIFIED') {
        throw this.createAuthError(error as AxiosError, this.errorTypes.EMAIL_NOT_VERIFIED);
      }
      
      // Check for invalid credentials
      if (axiosError.response?.status === 401) {
        throw this.createAuthError(error as AxiosError, this.errorTypes.INVALID_CREDENTIALS);
      }
      
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Authenticate using a social provider
   * @param socialAuthData Token from social provider
   * @returns Promise with user data and tokens
   */
  async socialAuth(socialAuthData: SocialAuthRequest): Promise<AuthResponseWithTokens> {
    try {
      let endpoint = '';
      
      // Determine the endpoint based on the provider
      switch (socialAuthData.provider) {
        case 'google':
          endpoint = AUTH_ENDPOINTS.GOOGLE_AUTH;
          break;
        case 'facebook':
          endpoint = AUTH_ENDPOINTS.FACEBOOK_AUTH;
          break;
        default:
          throw new Error('Unsupported social auth provider');
      }
      
      const response = await this.api.post<AuthResponseWithTokens>(
        endpoint, 
        { token: socialAuthData.token }
      );
      
      const { tokens, user } = response.data;
      
      // Store tokens securely
      this.setTokens(tokens);
      
      // Set up automatic token refresh
      this.setupTokenRefresh(tokens.expiresIn);
      
      return response.data;
    } catch (error) {
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Logout the current user
   * Removes the token from localStorage
   */
  /**
   * Logout the current user
   * Removes tokens and notifies server
   */
  async logout(): Promise<void> {
    try {
      // Only call the API if we have a token
      if (this.isAuthenticated()) {
        await this.api.post(AUTH_ENDPOINTS.LOGOUT);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear tokens regardless of API call success
      this.clearTokens();
      
      // Clear any scheduled token refresh
      this.clearTokenRefresh();
    }
  }
  
  /**
   * Request a password reset
   * @param data Email address to send reset link to
   * @returns Promise with response message
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<PasswordResponse> {
    try {
      const response = await this.api.post<PasswordResponse>(
        AUTH_ENDPOINTS.FORGOT_PASSWORD, 
        data
      );
      
      return response.data;
    } catch (error) {
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Reset password using token from email
   * @param data Reset token and new password
   * @returns Promise with response message
   */
  async resetPassword(data: ResetPasswordRequest): Promise<PasswordResponse> {
    try {
      const response = await this.api.post<PasswordResponse>(
        AUTH_ENDPOINTS.RESET_PASSWORD, 
        data
      );
      
      return response.data;
    } catch (error) {
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Change password when user is logged in
   * @param data Current password and new password
   * @returns Promise with response message
   */
  async changePassword(data: ChangePasswordRequest): Promise<PasswordResponse> {
    try {
      const response = await this.api.post<PasswordResponse>(
        AUTH_ENDPOINTS.CHANGE_PASSWORD, 
        data
      );
      
      return response.data;
    } catch (error) {
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Get the current authenticated user
   * @returns Promise with user data
   */
  /**
   * Get the current authenticated user
   * @returns Promise with user data
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<User>(AUTH_ENDPOINTS.ME);
      return response.data;
    } catch (error) {
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Refresh the access token using a refresh token
   * @param refreshToken The refresh token
   * @returns Promise with new token pair
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const data: RefreshTokenRequest = { refreshToken };
      const response = await this.api.post<TokenPair>(
        AUTH_ENDPOINTS.REFRESH_TOKEN, 
        data
      );
      
      const tokens = response.data;
      
      // Store the new tokens
      this.setTokens(tokens);
      
      // Set up token refresh for the new token
      this.setupTokenRefresh(tokens.expiresIn);
      
      return tokens;
    } catch (error) {
      // If refresh fails, clear all tokens
      this.clearTokens();
      throw this.createAuthError(error as AxiosError);
    }
  }
  
  /**
   * Check if a user is currently authenticated
   * @returns Boolean indicating if a user is authenticated
   */
  /**
   * Check if a user is currently authenticated
   * @returns Boolean indicating if a user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
  
  /**
   * Store authentication token in localStorage
   * @param token JWT token
   */
  /**
   * Store authentication tokens securely
   * @param tokens Token pair containing access and refresh tokens
   */
  private setTokens(tokens: TokenPair): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('tokenExpiry', (Date.now() + tokens.expiresIn * 1000).toString());
  }
  
  /**
   * Get access token from storage
   * @returns Access token or null if not found
   */
  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  
  /**
   * Get refresh token from storage
   * @returns Refresh token or null if not found
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  
  /**
   * Get token expiry timestamp
   * @returns Expiry timestamp or null if not found
   */
  private getTokenExpiry(): number | null {
    const expiry = localStorage.getItem('tokenExpiry');
    return expiry ? parseInt(expiry, 10) : null;
  }
  
  /**
   * Remove all authentication tokens from storage
   */
  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    this.clearTokenRefresh();
  }
  
  /**
   * Format error messages from API responses
   * @param error Axios error object
   * @returns Formatted error message
   */
  /**
   * Initialize token refresh mechanism if we have valid tokens
   */
  private initTokenRefresh(): void {
    const accessToken = this.getAccessToken();
    const expiry = this.getTokenExpiry();
    
    if (accessToken && expiry) {
      const now = Date.now();
      const timeUntilExpiry = expiry - now;
      
      // If token is still valid, set up refresh
      if (timeUntilExpiry > 0) {
        this.setupTokenRefresh(timeUntilExpiry / 1000);
      } else {
        // Token already expired, try to refresh immediately
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          this.refreshTokens(refreshToken).catch(() => {
            // If refresh fails, clear tokens
            this.clearTokens();
          });
        } else {
          // No refresh token, clear everything
          this.clearTokens();
        }
      }
    }
  }
  
  /**
   * Set up automatic token refresh before expiration
   * @param expiresIn Seconds until token expires
   */
  private setupTokenRefresh(expiresIn: number): void {
    // Clear any existing refresh
    this.clearTokenRefresh();
    
    // Calculate when to refresh (at 75% of token lifetime)
    const refreshTime = Math.floor(expiresIn * 0.75) * 1000;
    
    // Set timeout to refresh token
    this.refreshTimeoutId = window.setTimeout(async () => {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          await this.refreshTokens(refreshToken);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // Token refresh failed, clear tokens and notify app
          this.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        }
      }
    }, refreshTime);
  }
  
  /**
   * Clear token refresh timeout
   */
  private clearTokenRefresh(): void {
    if (this.refreshTimeoutId !== null) {
      window.clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }
  
  /**
   * Create a standardized authentication error
   * @param error Original error
   * @param errorType Specific error type
   * @returns Formatted error with type and message
   */
  private createAuthError(error: AxiosError, errorType?: string): Error {
    let message = 'An unexpected authentication error occurred';
    let type = errorType || this.errorTypes.UNKNOWN_ERROR;
    
    // Network errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      message = 'Connection timed out. Please check your internet connection.';
      type = this.errorTypes.NETWORK_ERROR;
    } else if (error.message === 'Network Error') {
      message = 'Unable to connect to the server. Please check your internet connection.';
      type = this.errorTypes.NETWORK_ERROR;
    }
    
    // Server errors
    else if (error.response) {
      // Try to extract error message from response data
      const responseData = error.response.data as any;
      
      // Set type based on status code if not already set
      if (!errorType) {
        switch (error.response.status) {
          case 401:
            type = this.errorTypes.UNAUTHORIZED;
            break;
          case 403:
            type = this.errorTypes.ACCOUNT_LOCKED;
            break;
          case 500:
            type = this.errorTypes.SERVER_ERROR;
            break;
        }
      }
      
      // Extract message from response
      if (typeof responseData === 'string') {
        message = responseData;
      } else if (responseData) {
        if (responseData.message) {
          message = responseData.message;
        } else if (responseData.error) {
          message = responseData.error;
        } else if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          message = responseData.errors[0].message || responseData.errors[0];
        }
      }
    } else if (error.message) {
      message = error.message;
    }
    
    // Create enhanced error object
    const enhancedError = new Error(message);
    (enhancedError as any).type = type;
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).originalError = error;
    
    return enhancedError;
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;

