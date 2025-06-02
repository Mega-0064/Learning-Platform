import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  AuthState, 
  User, 
  LoginCredentials, 
  RegistrationData, 
  VerificationRequest,
  VerificationResponse,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  PasswordResponse,
  ChangePasswordRequest,
  SocialAuthRequest,
  AuthResponseWithTokens
} from '../../types/auth';
import authService from '../../services/authService';
import { RootState } from '../store';

// Define initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  tokenExpiry: localStorage.getItem('tokenExpiry') ? parseInt(localStorage.getItem('tokenExpiry')!, 10) : null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
  // Email verification states
  isVerifying: false,
  isVerified: false,
  verificationError: null,
  // Password reset states
  isResettingPassword: false,
  passwordResetSuccess: false,
  passwordResetError: null,
  // Social auth states
  isSocialAuthLoading: false,
  socialAuthError: null,
};

// Define async thunk for registration
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegistrationData, { rejectWithValue }) => {
    try {
      // In a real app, this would call the authService.register method
      // For now, we'll simulate a successful registration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Mock user data for demonstration
      const user: User = {
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'student',
        avatar: `https://i.pravatar.cc/150?u=${userData.email}`, // Use email to generate consistent avatar
      };
      
      const token = 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9);
      
      // When connected to a real API, use the authService:
      // return await authService.register(userData);
      
      return { user, token };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for verifying email
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (verificationData: VerificationRequest, { rejectWithValue }) => {
    try {
      return await authService.verifyEmail(verificationData);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for resending verification email
export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerification',
  async (data: ResendVerificationRequest, { rejectWithValue }) => {
    try {
      return await authService.resendVerificationEmail(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for social authentication
export const socialAuth = createAsyncThunk(
  'auth/socialAuth',
  async (data: SocialAuthRequest, { rejectWithValue }) => {
    try {
      return await authService.socialAuth(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // In a real app, this would call the authService.login method
      // For now, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Mock user data for demonstration
      const user: User = {
        id: '1',
        username: 'johndoe',
        email: credentials.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        avatar: 'https://i.pravatar.cc/150?img=1',
      };
      
      const token = 'mock-jwt-token';
      
      // Store the token in localStorage for persistent authentication
      localStorage.setItem('token', token);
      
      // When connected to a real API, use the authService:
      // return await authService.login(credentials);
      
      return { user, token };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for requesting password reset
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (data: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      return await authService.forgotPassword(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for resetting password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      return await authService.resetPassword(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for changing password when logged in
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (data: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      return await authService.changePassword(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for refreshing token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const refreshToken = state.auth.refreshToken;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      return await authService.refreshTokens(refreshToken);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Define async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponseWithTokens>) => {
      state.user = action.payload.user;
      state.token = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.tokenExpiry = Date.now() + action.payload.tokens.expiresIn * 1000;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tokenExpiry = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearAuthErrors: (state) => {
      state.error = null;
      state.verificationError = null;
      state.passwordResetError = null;
      state.socialAuthError = null;
    },
    setVerified: (state, action: PayloadAction<boolean>) => {
      state.isVerified = action.payload;
    },
    resetPasswordState: (state) => {
      state.isResettingPassword = false;
      state.passwordResetSuccess = false;
      state.passwordResetError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle register action states
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponseWithTokens>) => {
        state.isLoading = false;
        // Unlike login, we don't set the user and token here,
        // as registration typically redirects to login or requires email verification
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle login action states
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponseWithTokens>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.tokenExpiry = Date.now() + action.payload.tokens.expiresIn * 1000;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle logout action state
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.tokenExpiry = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Handle social auth action states
      .addCase(socialAuth.pending, (state) => {
        state.isSocialAuthLoading = true;
        state.socialAuthError = null;
      })
      .addCase(socialAuth.fulfilled, (state, action: PayloadAction<AuthResponseWithTokens>) => {
        state.isSocialAuthLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.tokenExpiry = Date.now() + action.payload.tokens.expiresIn * 1000;
        state.isAuthenticated = true;
        state.socialAuthError = null;
      })
      .addCase(socialAuth.rejected, (state, action) => {
        state.isSocialAuthLoading = false;
        state.socialAuthError = action.payload as string;
      })
      
      // Handle email verification action states
      .addCase(verifyEmail.pending, (state) => {
        state.isVerifying = true;
        state.verificationError = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isVerifying = false;
        state.isVerified = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isVerifying = false;
        state.verificationError = action.payload as string;
      })
      
      // Handle resend verification email states
      .addCase(resendVerificationEmail.pending, (state) => {
        state.isVerifying = true;
        state.verificationError = null;
      })
      .addCase(resendVerificationEmail.fulfilled, (state) => {
        state.isVerifying = false;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.isVerifying = false;
        state.verificationError = action.payload as string;
      })
      
      // Handle forgot password states
      .addCase(forgotPassword.pending, (state) => {
        state.isResettingPassword = true;
        state.passwordResetError = null;
        state.passwordResetSuccess = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isResettingPassword = false;
        state.passwordResetSuccess = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isResettingPassword = false;
        state.passwordResetError = action.payload as string;
      })
      
      // Handle reset password states
      .addCase(resetPassword.pending, (state) => {
        state.isResettingPassword = true;
        state.passwordResetError = null;
        state.passwordResetSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isResettingPassword = false;
        state.passwordResetSuccess = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isResettingPassword = false;
        state.passwordResetError = action.payload as string;
      })
      
      // Handle change password states
      .addCase(changePassword.pending, (state) => {
        state.isResettingPassword = true;
        state.passwordResetError = null;
        state.passwordResetSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isResettingPassword = false;
        state.passwordResetSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isResettingPassword = false;
        state.passwordResetError = action.payload as string;
      })
      
      // Handle token refresh states
      .addCase(refreshToken.pending, (state) => {
        // We don't set loading state here to avoid UI flickers during background refresh
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenExpiry = Date.now() + action.payload.expiresIn * 1000;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        // If token refresh fails, clear credentials
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.tokenExpiry = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCredentials, 
  clearCredentials, 
  clearAuthErrors, 
  setVerified,
  resetPasswordState
} = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;

// Verification selectors
export const selectIsVerifying = (state: RootState) => state.auth.isVerifying;
export const selectIsVerified = (state: RootState) => state.auth.isVerified;
export const selectVerificationError = (state: RootState) => state.auth.verificationError;

// Password reset selectors
export const selectIsResettingPassword = (state: RootState) => state.auth.isResettingPassword;
export const selectPasswordResetSuccess = (state: RootState) => state.auth.passwordResetSuccess;
export const selectPasswordResetError = (state: RootState) => state.auth.passwordResetError;

// Social auth selectors
export const selectSocialAuthLoading = (state: RootState) => state.auth.isSocialAuthLoading;
export const selectSocialAuthError = (state: RootState) => state.auth.socialAuthError;

export default authSlice.reducer;

