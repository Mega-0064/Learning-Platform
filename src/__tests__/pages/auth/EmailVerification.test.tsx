import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../utils/theme';
import EmailVerification from '../../../pages/auth/EmailVerification';
import { verifyEmail, resendVerificationEmail } from '../../../features/auth/authSlice';

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

// Create mock store
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// Mock the auth slice actions
jest.mock('../../../features/auth/authSlice', () => ({
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
  selectIsVerifying: jest.fn((state) => state.auth.isVerifying),
  selectIsVerified: jest.fn((state) => state.auth.isVerified),
  selectVerificationError: jest.fn((state) => state.auth.verificationError),
}));

// Helper function to setup the component with different store states
const setupComponent = (storeState = {}, locationState = {}) => {
  const defaultState = {
    auth: {
      isVerifying: false,
      isVerified: false,
      verificationError: null,
    },
    ...storeState,
  };
  
  const store = mockStore(defaultState);
  
  // Mock the unwrap method for both actions
  (verifyEmail as jest.Mock).mockReturnValue({
    unwrap: jest.fn().mockResolvedValue({}),
  });
  
  (resendVerificationEmail as jest.Mock).mockReturnValue({
    unwrap: jest.fn().mockResolvedValue({}),
  });
  
  // Mock useLocation to return the specified search params
  (useLocation as jest.Mock).mockReturnValue({
    search: locationState.search || '',
    ...locationState,
  });
  
  // Mock useNavigate
  const navigateMock = jest.fn();
  (useNavigate as jest.Mock).mockReturnValue(navigateMock);
  
  return {
    component: render(
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <EmailVerification />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    ),
    store,
    navigateMock,
  };
};

describe('EmailVerification Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders default state without token', () => {
    setupComponent();
    
    // Check for default content
    expect(screen.getByText(/Email Verification Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Please check your email for a verification link/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend Verification Email/i })).toBeInTheDocument();
  });
  
  test('shows verification in progress when isVerifying is true', () => {
    setupComponent({ auth: { isVerifying: true } });
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/Verifying your email/i)).toBeInTheDocument();
  });
  
  test('shows success message when verification is successful', () => {
    setupComponent({ auth: { isVerified: true } });
    
    // Check for success message
    expect(screen.getByText(/Email Verified Successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/You can now access all features/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Login/i })).toBeInTheDocument();
  });
  
  test('shows error message when verification fails', () => {
    setupComponent({ 
      auth: { 
        verificationError: 'The verification link has expired', 
      }
    }, { search: '?token=expired-token' });
    
    // Check for error message
    expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/The verification link has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend Verification Email/i })).toBeInTheDocument();
  });
  
  test('attempts to verify email when token is in URL', async () => {
    setupComponent({}, { search: '?token=valid-token' });
    
    // Check that verifyEmail action was called with the token
    await waitFor(() => {
      expect(verifyEmail).toHaveBeenCalledWith({ token: 'valid-token' });
    });
  });
  
  test('shows and submits resend verification form', async () => {
    setupComponent();
    
    // Click the resend button to show form
    fireEvent.click(screen.getByRole('button', { name: /Resend Verification Email/i }));
    
    // Check that the form is displayed
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    
    // Enter email and submit
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
    fireEvent.click(screen.getByRole('button', { name: /Resend Email/i }));
    
    // Check that resendVerificationEmail action was called
    await waitFor(() => {
      expect(resendVerificationEmail).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });
  
  test('validates email in resend form', async () => {
    setupComponent();
    
    // Click the resend button to show form
    fireEvent.click(screen.getByRole('button', { name: /Resend Verification Email/i }));
    
    // Enter invalid email and submit
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'invalid-email');
    fireEvent.blur(screen.getByLabelText(/Email Address/i));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email/i)).toBeInTheDocument();
    });
    
    // Submit button should still be enabled but submission won't succeed due to validation
    expect(screen.getByRole('button', { name: /Resend Email/i })).not.toBeDisabled();
    
    // Enter valid email
    await userEvent.clear(screen.getByLabelText(/Email Address/i));
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'valid@example.com');
    fireEvent.blur(screen.getByLabelText(/Email Address/i));
    
    // Check that validation error is gone
    await waitFor(() => {
      expect(screen.queryByText(/Enter a valid email/i)).not.toBeInTheDocument();
    });
  });
  
  test('shows loading state when sending verification email', () => {
    setupComponent({ auth: { isVerifying: true } });
    
    // Click the resend button to show form
    fireEvent.click(screen.getByRole('button', { name: /Resend Verification Email/i }));
    
    // Check that loading indicator is shown and form elements are disabled
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: '' })).toBeDisabled(); // Loading button has no text
  });
  
  test('hides resend form after successful submission', async () => {
    const { store } = setupComponent();
    
    // Setup successful resend
    (resendVerificationEmail as jest.Mock).mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    
    // Click the resend button to show form
    fireEvent.click(screen.getByRole('button', { name: /Resend Verification Email/i }));
    
    // Enter email and submit
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
    fireEvent.click(screen.getByRole('button', { name: /Resend Email/i }));
    
    // Update store to simulate successful submission
    store.dispatch({ type: 'MOCK_RESEND_SUCCESS' });
    
    // Check that form is no longer visible
    await waitFor(() => {
      expect(screen.queryByLabelText(/Email Address/i)).not.toBeInTheDocument();
    });
  });
  
  test('navigates to login page when clicking Go to Login button', () => {
    const { navigateMock } = setupComponent({ auth: { isVerified: true } });
    
    // Click the Go to Login button
    fireEvent.click(screen.getByRole('button', { name: /Go to Login/i }));
    
    // Check that navigate was called with the correct path
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
  
  test('allows navigation to login from already verified link', () => {
    setupComponent();
    
    // Check that link to login exists
    expect(screen.getByText(/Already verified/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });
  
  test('cancels resend form and returns to default view', async () => {
    setupComponent();
    
    // Click the resend button to show form
    fireEvent.click(screen.getByRole('button', { name: /Resend Verification Email/i }));
    
    // Check that the form is displayed
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    
    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    // Check that form is hidden and default view is shown
    await waitFor(() => {
      expect(screen.queryByLabelText(/Email Address/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Resend Verification Email/i })).toBeInTheDocument();
    });
  });
});

