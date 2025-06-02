// User interface representing a user in the system
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
}

// Email verification interfaces
export interface VerificationRequest {
  token: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

// Password reset interfaces
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Token interfaces
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until access token expires
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Social auth interfaces
export interface SocialAuthRequest {
  token: string; // Token from social provider
  provider: 'google' | 'facebook';
}

// Extended auth response with tokens
export interface AuthResponseWithTokens extends AuthResponse {
  tokens: TokenPair;
}
// Authentication API response interface
export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}
// Authentication state interface for the Redux store
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Email verification states
  isVerifying: boolean;
  isVerified: boolean;
  verificationError: string | null;
  // Password reset states
  isResettingPassword: boolean;
  passwordResetSuccess: boolean;
  passwordResetError: string | null;
  // Social auth states
  isSocialAuthLoading: boolean;
  socialAuthError: string | null;
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data interface
export interface RegistrationData extends LoginCredentials {
  username: string;
  firstName: string;
  lastName: string;
}

