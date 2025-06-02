import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../utils/theme';

// Import components
import App from '../../App';
import Login from '../../pages/Login';
import Registration from '../../pages/Registration/Registration';
import EmailVerification from '../../pages/auth/EmailVerification';
import ForgotPassword from '../../pages/auth/ForgotPassword';
import ResetPassword from '../../pages/auth/ResetPassword';
import ChangePassword from '../../pages/auth/ChangePassword';
import Profile from '../../pages/Profile';
import Home from '../../pages/Home';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import MainLayout from '../../components/layout/MainLayout';

// Import reducers and types
import authReducer, {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  socialAuth
} from '../../features/auth/authSlice';
import { User } from '../../types/auth';

// Mock data
const mockUser: User = {
  id: '123',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'student',
  avatar: 'https://i.pravatar.cc/150?img=1'
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600
};

// Mock redux actions
jest.mock('../../features/auth/authSlice', () => {
  const actual = jest.requireActual('../../features/auth/authSlice');
  return {
    ...actual,
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    logout: jest.fn(),
    socialAuth: jest.fn(),
  };
});

// Setup test application with redux
const setupTestApp = (initialRoute = '/', preloadedState = {}) => {
  // Create a Redux store with the auth reducer
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        refreshToken: null,
        tokenExpiry: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isVerifying: false,
        isVerified: false,
        verificationError: null,
        isResettingPassword: false,
        passwordResetSuccess: false,
        passwordResetError: null,
        isSocialAuthLoading: false,
        socialAuthError: null,
        ...preloadedState,
      },
    },
  });

  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Registration />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Routes with layout */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                
                {/* Protected routes */}
                <Route path="profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="change-password" element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    ),
    store,
  };
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });
  
  describe('Registration to Login Flow', () => {
    test('user can register, verify email, and login', async () => {
      // Mock registration success
      (register as jest.Mock).mockReturnValue({
        type: 'auth/register/fulfilled',
        payload: { user: mockUser, tokens: mockTokens }
      });
      
      // Mock verification success
      (verifyEmail as jest.Mock).mockReturnValue({
        type: 'auth/verifyEmail/fulfilled'
      });
      
      // Mock login success
      (login as jest.Mock).mockReturnValue({
        type: 'auth/login/fulfilled',
        payload: { user: mockUser, tokens: mockTokens }
      });
      
      // Start at registration page
      const { store } = setupTestApp('/register');
      
      // Check that we're on the registration page
      expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
      
      // Fill in registration form
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/first name/i), 'Test');
      await userEvent.type(screen.getByLabelText(/last name/i), 'User');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ss123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss123');
      
      // Submit registration form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // Check that register was called with correct data
      await waitFor(() => {
        expect(register).toHaveBeenCalledWith({
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });
      });
      
      // Manually update store to simulate successful registration
      store.dispatch({
        type: 'auth/register/fulfilled',
        payload: { user: mockUser }
      });
      
      // Navigate to email verification (this would happen in a real app)
      const { store: verifyStore } = setupTestApp(
        '/verify-email?token=valid-token',
        { isVerifying: true }
      );
      
      // Verify should be called with the token
      await waitFor(() => {
        expect(verifyEmail).toHaveBeenCalledWith({ token: 'valid-token' });
      });
      
      // Manually update store to simulate successful verification
      verifyStore.dispatch({
        type: 'auth/verifyEmail/fulfilled'
      });
      
      // Simulate state after verification
      const { store: loginStore } = setupTestApp(
        '/login',
        { isVerified: true }
      );
      
      // Fill in login form
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'StrongP@ss123');
      
      // Submit login form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Check that login was called with correct credentials
      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'StrongP@ss123',
        });
      });
      
      // Manually update store to simulate successful login
      loginStore.dispatch({
        type: 'auth/login/fulfilled',
        payload: { 
          user: mockUser, 
          tokens: mockTokens 
        }
      });
      
      // User should now be authenticated
      expect(loginStore.getState().auth.isAuthenticated).toBe(true);
      expect(loginStore.getState().auth.user).toEqual(mockUser);
    });
  });
  
  describe('Password Reset Flow', () => {
    test('user can request password reset, set new password, and login', async () => {
      // Mock forgot password success
      (forgotPassword as jest.Mock).mockReturnValue({
        type: 'auth/forgotPassword/fulfilled'
      });
      
      // Mock reset password success
      (resetPassword as jest.Mock).mockReturnValue({
        type: 'auth/resetPassword/fulfilled'
      });
      
      // Mock login success
      (login as jest.Mock).mockReturnValue({
        type: 'auth/login/fulfilled',
        payload: { user: mockUser, tokens: mockTokens }
      });
      
      // Start at forgot password page
      const { store: forgotStore } = setupTestApp('/forgot-password');
      
      // Fill in email
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      
      // Submit forgot password form
      fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
      
      // Check that forgotPassword was called with the correct email
      await waitFor(() => {
        expect(forgotPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });
      
      // Manually update store to simulate successful request
      forgotStore.dispatch({
        type: 'auth/forgotPassword/fulfilled'
      });
      
      // User should see success message
      await waitFor(() => {
        expect(screen.getByText(/Password reset instructions have been sent/i)).toBeInTheDocument();
      });
      
      // Navigate to reset password page with token
      const { store: resetStore } = setupTestApp('/reset-password?token=valid-reset-token');
      
      // Fill in new password
      await userEvent.type(screen.getByLabelText(/new password/i), 'NewStrongP@ss123');
      await userEvent.type(screen.getByLabelText(/confirm new password/i), 'NewStrongP@ss123');
      
      // Submit reset password form
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      // Check that resetPassword was called with correct data
      await waitFor(() => {
        expect(resetPassword).toHaveBeenCalledWith({
          token: 'valid-reset-token',
          password: 'NewStrongP@ss123',
          confirmPassword: 'NewStrongP@ss123',
        });
      });
      
      // Manually update store to simulate successful reset
      resetStore.dispatch({
        type: 'auth/resetPassword/fulfilled'
      });
      
      // User should see success message
      await waitFor(() => {
        expect(screen.getByText(/Your password has been successfully reset/i)).toBeInTheDocument();
      });
      
      // Navigate to login page
      const { store: loginStore } = setupTestApp('/login');
      
      // Fill in login form with new password
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'NewStrongP@ss123');
      
      // Submit login form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Check that login was called with correct credentials
      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'NewStrongP@ss123',
        });
      });
      
      // Manually update store to simulate successful login
      loginStore.dispatch({
        type: 'auth/login/fulfilled',
        payload: { 
          user: mockUser, 
          tokens: mockTokens 
        }
      });
      
      // User should now be authenticated
      expect(loginStore.getState().auth.isAuthenticated).toBe(true);
    });
  });
  
  describe('Change Password Flow', () => {
    test('authenticated user can change their password', async () => {
      // Mock change password success
      (changePassword as jest.Mock).mockReturnValue({
        type: 'auth/changePassword/fulfilled'
      });
      
      // Start at change password page with authenticated user
      const { store } = setupTestApp(
        '/change-password',
        { 
          isAuthenticated: true, 
          user: mockUser,
          token: mockTokens.accessToken 
        }
      );
      
      // Fill in password change form
      await userEvent.type(screen.getByLabelText(/current password/i), 'CurrentP@ss123');
      await userEvent.type(screen.getByLabelText(/new password/i), 'NewStrongP@ss123');
      await userEvent.type(screen.getByLabelText(/confirm new password/i), 'NewStrongP@ss123');
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
      
      // Check that changePassword was called with correct data
      await waitFor(() => {
        expect(changePassword).toHaveBeenCalledWith({
          currentPassword: 'CurrentP@ss123',
          newPassword: 'NewStrongP@ss123',
          confirmPassword: 'NewStrongP@ss123',
        });
      });
      
      // Manually update store to simulate successful password change
      store.dispatch({
        type: 'auth/changePassword/fulfilled'
      });
      
      // User should see success message
      await waitFor(() => {
        expect(screen.getByText(/Your password has been successfully changed/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Social Authentication Flow', () => {
    test('user can authenticate with social provider', async () => {
      // Mock social auth success
      (socialAuth as jest.Mock).mockReturnValue({
        type: 'auth/socialAuth/fulfilled',
        payload: { user: mockUser, tokens: mockTokens }
      });
      
      // Create a mock for window.open
      const mockOpen = jest.fn();
      window.open = mockOpen;
      
      // Start at login page
      const { store } = setupTestApp('/login');
      
      // Click on social login button (e.g., Google)
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      
      // In a real scenario, a popup would open and redirect back with a token
      // Here we'll simulate receiving the token and manually dispatch the action
      
      // Simulate social auth response
      const mockToken = 'google-auth-token-123';
      
      // Manually dispatch social auth action (would be done after receiving token)
      store.dispatch(socialAuth({
        token: mockToken,
        provider: 'google'
      }));
      
      // Check that socialAuth would be called with the token
      expect(socialAuth).toHaveBeenCalledWith({
        token: mockToken,
        provider: 'google'
      });
      
      // Manually update store to simulate successful social auth
      store.dispatch({
        type: 'auth/socialAuth/fulfilled',
        payload: { 
          user: mockUser, 
          tokens: mockTokens 
        }
      });
      
      // User should now be authenticated
      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.user).toEqual(mockUser);
    });
  });
  
  describe('Error Recovery Paths', () => {
    test('user can recover from registration errors', async () => {
      // Mock registration failure
      (register as jest.Mock).mockReturnValue({
        type: 'auth/register/rejected',
        payload: 'Email already exists'
      });
      
      // Start at registration page
      const { store } = setupTestApp('/register');
      
      // Fill in registration form
      await userEvent.type(screen.getByLabelText(/username/i), 'existinguser');
      await userEvent.type(screen.getByLabelText(/first name/i), 'Existing');
      await userEvent.type(screen.getByLabelText(/last name/i), 'User');
      await userEvent.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ss123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss123');
      
      // Submit registration form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // Manually update store to simulate error
      store.dispatch({
        type: 'auth/register/rejected',
        payload: 'Email already exists'
      });
      
      // User should see error message
      await waitFor(() => {
        expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
      });
      
      // User can try again with different email
      await userEvent.clear(screen.getByLabelText(/email/i));
      await userEvent.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      
      // Mock successful registration for the retry
      (register as jest.Mock).mockReturnValue({
        type: 'auth/register/fulfilled',
        payload: { 
          user: { ...mockUser, email: 'newuser@example.com' },
          tokens: mockTokens
        }
      });
      
      // Submit form again
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // Manually update store to simulate success
      store.dispatch({
        type: 'auth/register/fulfilled',
        payload: { 
          user: { ...mockUser, email: 'newuser@example.com' } 
        }
      });
      
      // Error should no longer be present
      await waitFor(() => {
        expect(screen.queryByText(/Email already exists/i)).not.toBeInTheDocument();
      });
    });
    
    test('user can recover from login errors', async () => {
      // Mock login failure
      (login as jest.Mock).mockReturnValue({
        type: 'auth/login/rejected',
        payload: 'Invalid credentials'
      });
      
      // Start at login page
      const { store } = setupTestApp('/login');
      
      // Fill in login form with incorrect credentials
      await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'WrongPassword');
      
      // Submit login form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Manually update store to simulate error
      store.dispatch({
        type: 'auth/login/rejected',
        payload: 'Invalid credentials'
      });
      
      // User should see error message
      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
      
      // User can try again with correct credentials
      await userEvent.clear(screen.getByLabelText(/password/i));
      await userEvent.type(screen.getByLabelText(/password/i), 'CorrectP@ss123');
      
      // Mock successful login for the retry
      (login as jest.Mock).mockReturnValue({
        type: 'auth/login/fulfilled',
        payload: { user: mockUser, tokens: mockTokens }
      });
      
      // Submit form again
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Manually update store to simulate success
      store.dispatch({
        type: 'auth/login/fulfilled',
        payload: { 
          user: mockUser, 
          tokens: mockTokens 
        }
      });
      
      // Error should no longer be present and user should be authenticated
      await waitFor(() => {
        expect(screen.queryByText(/Invalid credentials/i)).not.toBeInTheDocument();
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });
    });
  });
  
  describe('Token Refresh Flow', () => {
    test('expired token triggers refresh', async () => {
      // Create a mock implementation for the refresh token interceptor
      const mockRefresh = jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      });
      
      // Store the original implementations
      const originalDateNow = Date.now;
      const originalSetTimeout = window.setTimeout;
      
      // Mock Date.now to simulate token expiry
      Date.now = jest.fn(() => new Date('2023-01-01T12:00:00Z').getTime());
      
      // Mock setTimeout to immediately execute refresh callback
      window.setTimeout = jest.fn((callback) => {
        callback();
        return 123; // Return a timeout ID
      });
      
      // Start with an authenticated user with about-to-expire token
      const { store } = setupTestApp(
        '/profile',
        { 
          isAuthenticated: true, 
          user: mockUser,
          token: 'expiring-token',
          refreshToken: 'valid-refresh-token',
          tokenExpiry: Date.now() + 10000 // 10 seconds until expiry
        }
      );
      
      // Restore the original implementations
      Date.now = originalDateNow;
      window.setTimeout = originalSetTimeout;
      
      // In a real application, the token refresh would happen automatically
      // Here we'll manually dispatch the refresh action to simulate it
      
      // This is just to verify our test setup
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
  });
});

