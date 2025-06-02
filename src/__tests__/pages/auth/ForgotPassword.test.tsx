import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, Link as RouterLink } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../utils/theme';
import ForgotPassword from '../../../pages/auth/ForgotPassword';
import { 
  forgotPassword,
  resetPasswordState,
  selectIsResettingPassword,
  selectPasswordResetSuccess,
  selectPasswordResetError
} from '../../../features/auth/authSlice';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: jest.fn(({ children, ...props }) => <a {...props}>{children}</a>),
}));

jest.mock('../../../features/auth/authSlice', () => ({
  forgotPassword: jest.fn(),
  resetPasswordState: jest.fn(),
  selectIsResettingPassword: jest.fn((state) => state.auth.isResettingPassword),
  selectPasswordResetSuccess: jest.fn((state) => state.auth.passwordResetSuccess),
  selectPasswordResetError: jest.fn((state) => state.auth.passwordResetError),
}));

// Create mock store
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// Helper function to setup the component with different store states
const setupComponent = (storeState = {}) => {
  const defaultState = {
    auth: {
      isResettingPassword: false,
      passwordResetSuccess: false,
      passwordResetError: null,
    },
    ...storeState,
  };
  
  const store = mockStore(defaultState);
  
  // Mock the forgotPassword action
  (forgotPassword as jest.Mock).mockReturnValue({
    type: 'auth/forgotPassword',
  });
  
  return {
    component: render(
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <ForgotPassword />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    ),
    store,
  };
};

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders forgot password form', () => {
    setupComponent();
    
    // Check for heading and description
    expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter your email to receive password reset instructions/i)).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Instructions/i })).toBeInTheDocument();
    
    // Check for sign in link
    expect(screen.getByText(/Remember your password/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });
  
  test('shows validation error for invalid email', async () => {
    setupComponent();
    
    // Enter invalid email
    await userEvent.type(screen.getByLabelText(/Email/i), 'invalid-email');
    fireEvent.blur(screen.getByLabelText(/Email/i));
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Instructions/i }));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email/i)).toBeInTheDocument();
    });
    
    // Ensure action was not called
    expect(forgotPassword).not.toHaveBeenCalled();
  });
  
  test('submits form with valid email', async () => {
    setupComponent();
    
    // Enter valid email
    await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Instructions/i }));
    
    // Ensure action was called with correct email
    expect(forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
  
  test('shows loading state during submission', () => {
    // Setup with loading state
    setupComponent({ auth: { isResettingPassword: true } });
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Check that submit button is disabled
    expect(screen.getByRole('button', { name: '' })).toBeDisabled();
    
    // Check that email field is disabled
    expect(screen.getByLabelText(/Email/i)).toBeDisabled();
  });
  
  test('shows success message after password reset request', () => {
    // Setup with success state
    setupComponent({ auth: { passwordResetSuccess: true } });
    
    // Check for success message
    expect(screen.getByText(/Password reset instructions have been sent to your email/i)).toBeInTheDocument();
    expect(screen.getByText(/Please check your inbox/i)).toBeInTheDocument();
    
    // Check for back to login button
    expect(screen.getByRole('button', { name: /Back to Login/i })).toBeInTheDocument();
    
    // Form should not be visible
    expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();
  });
  
  test('shows error message when request fails', () => {
    // Setup with error state
    setupComponent({ auth: { passwordResetError: 'Account not found' } });
    
    // Check for error message
    expect(screen.getByText(/Account not found/i)).toBeInTheDocument();
    
    // Form should still be visible
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });
  
  test('cleans up state when component unmounts', () => {
    const { component } = setupComponent();
    
    // Unmount component
    component.unmount();
    
    // Check that resetPasswordState was called
    expect(resetPasswordState).toHaveBeenCalled();
  });
  
  test('back to login button navigates correctly', () => {
    // Setup with success state
    setupComponent({ auth: { passwordResetSuccess: true } });
    
    // Get back to login button
    const backButton = screen.getByRole('button', { name: /Back to Login/i });
    
    // Check that it has the correct link
    expect(backButton).toHaveAttribute('href', '/login');
  });
});

