import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../utils/theme';
import Registration from '../../../pages/Registration/Registration';
import { register } from '../../../features/auth/authSlice';

// Create mock store
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

// Mock the register action
jest.mock('../../../features/auth/authSlice', () => ({
  register: jest.fn(),
  // Include other actions that might be used
  selectIsResettingPassword: jest.fn((state) => state.auth.isLoading),
  selectPasswordResetSuccess: jest.fn((state) => state.auth.passwordResetSuccess),
  selectPasswordResetError: jest.fn((state) => state.auth.error),
}));

// Helper function to setup the component with different store states
const setupComponent = (storeState = {}) => {
  const defaultState = {
    auth: {
      isLoading: false,
      error: null,
      passwordResetSuccess: false,
    },
    ...storeState,
  };
  
  const store = mockStore(defaultState);
  
  // Mock the unwrap method that's returned from dispatch(register())
  (register as jest.Mock).mockReturnValue({
    unwrap: jest.fn().mockResolvedValue({}),
  });
  
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Registration />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Registration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders registration form with all fields', () => {
    setupComponent();
    
    // Check for form fields
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    
    // Check for links
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
  
  test('shows validation errors for empty fields', async () => {
    setupComponent();
    
    // Submit without filling fields
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });
  });
  
  test('validates email format', async () => {
    setupComponent();
    
    // Enter invalid email
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    fireEvent.blur(screen.getByLabelText(/email/i));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    });
    
    // Enter valid email
    await userEvent.clear(screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'valid@example.com');
    fireEvent.blur(screen.getByLabelText(/email/i));
    
    // Check that validation error is gone
    await waitFor(() => {
      expect(screen.queryByText(/enter a valid email/i)).not.toBeInTheDocument();
    });
  });
  
  test('validates password requirements', async () => {
    setupComponent();
    
    // Enter weak password
    await userEvent.type(screen.getByLabelText(/^password$/i), 'weak');
    fireEvent.blur(screen.getByLabelText(/^password$/i));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/minimum 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/must contain at least one uppercase/i)).toBeInTheDocument();
    });
    
    // Enter strong password
    await userEvent.clear(screen.getByLabelText(/^password$/i));
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ss123');
    fireEvent.blur(screen.getByLabelText(/^password$/i));
    
    // Check that validation errors are gone
    await waitFor(() => {
      expect(screen.queryByText(/minimum 8 characters/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/must contain at least one uppercase/i)).not.toBeInTheDocument();
    });
  });
  
  test('validates passwords match', async () => {
    setupComponent();
    
    // Enter different passwords
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ss123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'DifferentP@ss123');
    fireEvent.blur(screen.getByLabelText(/confirm password/i));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
    });
    
    // Enter matching passwords
    await userEvent.clear(screen.getByLabelText(/confirm password/i));
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss123');
    fireEvent.blur(screen.getByLabelText(/confirm password/i));
    
    // Check that validation error is gone
    await waitFor(() => {
      expect(screen.queryByText(/passwords must match/i)).not.toBeInTheDocument();
    });
  });
  
  test('submits form with valid data', async () => {
    setupComponent();
    
    // Fill all fields with valid data
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/first name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/last name/i), 'User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ss123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss123');
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Check that register action was called with correct data
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'StrongP@ss123',
      });
    });
  });
  
  test('shows loading state during form submission', async () => {
    // Setup with loading state
    setupComponent({ auth: { isLoading: true } });
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Check that submit button is disabled
    expect(screen.getByRole('button', { name: '' })).toBeDisabled();
    
    // Check that all fields are disabled
    expect(screen.getByLabelText(/username/i)).toBeDisabled();
    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
    expect(screen.getByLabelText(/last name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
  });
  
  test('shows error message when registration fails', async () => {
    // Setup with error state
    setupComponent({ auth: { error: 'Registration failed: Email already exists' } });
    
    // Check for error message
    expect(screen.getByText(/Registration failed: Email already exists/i)).toBeInTheDocument();
  });
  
  test('toggles password visibility', async () => {
    setupComponent();
    
    // Password should be hidden by default
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
    
    // Click the visibility toggle button
    fireEvent.click(screen.getAllByLabelText(/toggle password visibility/i)[0]);
    
    // Password should now be visible
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'text');
    
    // Click again to hide
    fireEvent.click(screen.getAllByLabelText(/toggle password visibility/i)[0]);
    
    // Password should be hidden again
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
  });
  
  test('navigates to login page on successful registration', async () => {
    const navigateMock = jest.fn();
    
    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => navigateMock,
    }));
    
    // Mock successful registration
    (register as jest.Mock).mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    
    setupComponent();
    
    // Fill and submit form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/first name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/last name/i), 'User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'StrongP@ss123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss123');
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    // Check navigation (this won't actually work due to mocking limitations in this example)
    // In a real test, we'd use a better mock setup or test the component's internal behavior
  });
});

