import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../utils/theme';
import ResetPassword from '../../../pages/auth/ResetPassword';
import { 
  resetPassword,
  resetPasswordState,
  selectIsResettingPassword,
  selectPasswordResetSuccess,
  selectPasswordResetError
} from '../../../features/auth/authSlice';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('../../../features/auth/authSlice', () => ({
  resetPassword: jest.fn(),
  resetPasswordState: jest.fn(),
  selectIsResettingPassword: jest.fn((state) => state.auth.isResettingPassword),
  selectPasswordResetSuccess: jest.fn((state) => state.auth.passwordResetSuccess),
  selectPasswordResetError: jest.fn((state) => state.auth.passwordResetError),
}));

// Create mock store
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// Helper function to setup the component with different store states
const setupComponent = (storeState = {}, locationState = {}) => {
  const defaultState = {
    auth: {
      isResettingPassword: false,
      passwordResetSuccess: false,
      passwordResetError: null,
    },
    ...storeState,
  };
  
  const store = mockStore(defaultState);
  
  // Mock the resetPassword action
  (resetPassword as jest.Mock).mockReturnValue({
    type: 'auth/resetPassword',
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
            <ResetPassword />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    ),
    store,
    navigateMock,
  };
};

describe('ResetPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any timers
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('shows error for invalid token', () => {
    setupComponent({}, { search: '' }); // No token in URL
    
    // Should show invalid token message
    expect(screen.getByText(/Invalid Reset Link/i)).toBeInTheDocument();
    expect(screen.getByText(/The password reset link is invalid or has expired/i)).toBeInTheDocument();
    
    // Check for request new link button
    expect(screen.getByRole('button', { name: /Request New Link/i })).toBeInTheDocument();
    
    // Check for back to login button
    expect(screen.getByRole('button', { name: /Back to Login/i })).toBeInTheDocument();
  });
  
  test('renders reset password form with valid token', () => {
    setupComponent({}, { search: '?token=valid-token' });
    
    // Check for heading and description
    expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Create a new, strong password for your account/i)).toBeInTheDocument();
    
    // Check for form fields
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    
    // Check for submit button
    expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
    
    // Check for password requirements info
    expect(screen.getByText(/Your password must be at least 8 characters long/i)).toBeInTheDocument();
  });
  
  test('validates password strength', async () => {
    setupComponent({}, { search: '?token=valid-token' });
    
    // Enter weak password
    await userEvent.type(screen.getByLabelText(/New Password/i), 'weak');
    fireEvent.blur(screen.getByLabelText(/New Password/i));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Password should be of minimum 8 characters length/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });
    
    // Enter strong password
    await userEvent.clear(screen.getByLabelText(/New Password/i));
    await userEvent.type(screen.getByLabelText(/New Password/i), 'StrongP@ss123');
    fireEvent.blur(screen.getByLabelText(/New Password/i));
    
    // Validation errors should be gone
    await waitFor(() => {
      expect(screen.queryByText(/Password should be of minimum 8 characters length/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Password must contain at least one uppercase letter/i)).not.toBeInTheDocument();
    });
  });
  
  test('validates password confirmation matching', async () => {
    setupComponent({}, { search: '?token=valid-token' });
    
    // Enter different passwords
    await userEvent.type(screen.getByLabelText(/New Password/i), 'StrongP@ss123');
    await userEvent.type(screen.getByLabelText(/Confirm New Password/i), 'DifferentP@ss123');
    fireEvent.blur(screen.getByLabelText(/Confirm New Password/i));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Passwords must match/i)).toBeInTheDocument();
    });
    
    // Enter matching passwords
    await userEvent.clear(screen.getByLabelText(/Confirm New Password/i));
    await userEvent.type(screen.getByLabelText(/Confirm New Password/i), 'StrongP@ss123');
    fireEvent.blur(screen.getByLabelText(/Confirm New Password/i));
    
    // Validation error should be gone
    await waitFor(() => {
      expect(screen.queryByText(/Passwords must match/i)).not.toBeInTheDocument();
    });
  });
  
  test('submits form with valid data', async () => {
    setupComponent({}, { search: '?token=valid-token' });
    
    // Enter valid passwords
    await userEvent.type(screen.getByLabelText(/New Password/i), 'StrongP@ss123');
    await userEvent.type(screen.getByLabelText(/Confirm New Password/i), 'StrongP@ss123');
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));
    
    // Check that resetPassword action was called with correct data
    expect(resetPassword).toHaveBeenCalledWith({
      token: 'valid-token',
      password: 'StrongP@ss123',
      confirmPassword: 'StrongP@ss123',
    });
  });
  
  test('shows loading state during submission', () => {
    setupComponent({ auth: { isResettingPassword: true } }, { search: '?token=valid-token' });
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Check that submit button is disabled
    expect(screen.getByRole('button', { name: '' })).toBeDisabled();
    
    // Check that password fields are disabled
    expect(screen.getByLabelText(/New Password/i)).toBeDisabled();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeDisabled();
  });
  
  test('shows success message after password reset', () => {
    setupComponent({ auth: { passwordResetSuccess: true } }, { search: '?token=valid-token' });
    
    // Check for success message
    expect(screen.getByText(/Your password has been successfully reset/i)).toBeInTheDocument();
    expect(screen.getByText(/You will be redirected to the login page/i)).toBeInTheDocument();
    
    // Check for login button
    expect(screen.getByRole('button', { name: /Go to Login Now/i })).toBeInTheDocument();
    
    // Form should not be visible
    expect(screen.queryByLabelText(/New Password/i)).not.toBeInTheDocument();
  });
  
  test('auto-redirects to login after success', async () => {
    const { navigateMock } = setupComponent(
      { auth: { passwordResetSuccess: true } }, 
      { search: '?token=valid-token' }
    );
    
    // Fast-forward past the timeout
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Check that navigate was called with the correct path
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
  
  test('shows error message when reset fails', () => {
    setupComponent(
      { auth: { passwordResetError: 'The reset link has expired' } }, 
      { search: '?token=expired-token' }
    );
    
    // Check for error message
    expect(screen.getByText(/The reset link has expired/i)).toBeInTheDocument();
    
    // Form should still be visible
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
  });
  
  test('toggles password visibility', async () => {
    setupComponent({}, { search: '?token=valid-token' });
    
    // Password fields should be hidden by default
    expect(screen.getByLabelText(/New Password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/Confirm New Password/i)).toHaveAttribute('type', 'password');
    
    // Click the visibility toggle buttons
    fireEvent.click(screen.getAllByLabelText(/toggle password visibility/i)[0]);
    fireEvent.click(screen.getAllByLabelText(/toggle confirm password visibility/i)[0]);
    
    // Password fields should now be visible
    expect(screen.getByLabelText(/New Password/i)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/Confirm New Password/i)).toHaveAttribute('type', 'text');
  });
  
  test('navigates to forgot password page when requesting new link', () => {
    const { navigateMock } = setupComponent({}, { search: '' }); // Invalid token
    
    // Click request new link button
    fireEvent.click(screen.getByRole('button', { name: /Request New Link/i }));
    
    // Check navigation
    expect(navigateMock).toHaveBeenCalledWith('/forgot-password');
  });
  
  test('navigates to login from invalid token view', () => {
    const { navigateMock } = setupComponent({}, { search: '' }); // Invalid token
    
    // Click back to login button
    fireEvent.click(screen.getByRole('button', { name: /Back to Login/i }));
    
    // Check navigation
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
  
  test('cleans up state when component unmounts', () => {
    const { component } = setupComponent({}, { search: '?token=valid-token' });
    
    // Unmount component
    component.unmount();
    
    // Check that resetPasswordState was called
    expect(resetPasswordState).toHaveBeenCalled();
  });
});

