# Authentication System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Components and Usage](#components-and-usage)
3. [Redux State Management](#redux-state-management)
4. [API Integration](#api-integration)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [Security Considerations](#security-considerations)
8. [Common Use Cases](#common-use-cases)
9. [Configuration](#configuration)
10. [Deployment Considerations](#deployment-considerations)

## System Overview

The authentication system in the React Learning Platform provides a complete solution for user registration, login, email verification, password management, and session handling. It's built using React, Redux Toolkit, and Material-UI with TypeScript for type safety.

### Features

- User registration with validation
- Email verification
- Login/logout functionality
- Token-based authentication with refresh tokens
- Password reset workflow
- Social authentication (Google, Facebook)
- Session management
- Protected routes
- Comprehensive error handling

### Architecture

The system follows a layered architecture:

1. **UI Layer**: React components for user interaction
2. **State Management**: Redux for centralized state
3. **Service Layer**: API integration services
4. **API Layer**: Backend communication
5. **Utilities**: Helper functions and hooks

### Authentication Flow

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Registration│───────│Email         │───────│   Login      │
│              │       │Verification  │       │              │
└──────────────┘       └──────────────┘       └──────────────┘
                                                     │
                                                     ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Logout      │◄──────│ Protected    │◄──────│Token Refresh │
│              │       │ Resources    │       │              │
└──────────────┘       └──────────────┘       └──────────────┘
```

## Components and Usage

### Main Components

#### Registration Component

The Registration component allows users to create a new account.

```jsx
import Registration from './pages/Registration/Registration';

<Registration />
```

#### Email Verification Component

Handles verifying user email addresses via tokens sent to their email.

```jsx
import EmailVerification from './pages/auth/EmailVerification';

<EmailVerification />
```

#### Login Component

Provides login functionality with validation and error handling.

```jsx
import Login from './pages/Login';

<Login />
```

#### ForgotPassword Component

Allows users to request a password reset link.

```jsx
import ForgotPassword from './pages/auth/ForgotPassword';

<ForgotPassword />
```

#### ResetPassword Component

Lets users set a new password using a reset token.

```jsx
import ResetPassword from './pages/auth/ResetPassword';

<ResetPassword />
```

#### ChangePassword Component

Allows authenticated users to change their password.

```jsx
import ChangePassword from './pages/auth/ChangePassword';

<ChangePassword />
```

#### ProtectedRoute Component

Wraps routes that require authentication.

```jsx
import ProtectedRoute from './components/auth/ProtectedRoute';

<Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />
```

### Utility Components

#### ErrorBoundary Component

Provides error handling for authentication components.

```jsx
import ErrorBoundary, { ErrorType } from './components/common/ErrorBoundary';

<ErrorBoundary type={ErrorType.AUTHENTICATION}>
  <Login />
</ErrorBoundary>
```

#### LoadingOverlay Component

Shows loading state during authentication operations.

```jsx
import LoadingOverlay from './components/common/LoadingOverlay';

<LoadingOverlay loading={isLoading} fullScreen message="Logging in...">
  <LoginForm />
</LoadingOverlay>
```

## Redux State Management

### Auth Slice

The authentication state is managed through the `authSlice.ts` file, which defines:

- Initial state
- Redux actions and reducers
- Async thunks for API calls
- Selectors for accessing state

### Auth State Interface

```typescript
interface AuthState {
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
```

### Key Actions

```typescript
// Auth actions
const authActions = {
  register: createAsyncThunk<AuthResponseWithTokens, RegistrationData>('auth/register', ...),
  login: createAsyncThunk<AuthResponseWithTokens, LoginCredentials>('auth/login', ...),
  verifyEmail: createAsyncThunk<VerificationResponse, VerificationRequest>('auth/verifyEmail', ...),
  forgotPassword: createAsyncThunk<PasswordResponse, ForgotPasswordRequest>('auth/forgotPassword', ...),
  resetPassword: createAsyncThunk<PasswordResponse, ResetPasswordRequest>('auth/resetPassword', ...),
  changePassword: createAsyncThunk<PasswordResponse, ChangePasswordRequest>('auth/changePassword', ...),
  logout: createAsyncThunk<void, void>('auth/logout', ...),
  refreshToken: createAsyncThunk<TokenPair, void>('auth/refreshToken', ...),
  socialAuth: createAsyncThunk<AuthResponseWithTokens, SocialAuthRequest>('auth/socialAuth', ...),
};
```

### Using Auth State

```typescript
import { useAppSelector } from '../utils/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '../features/auth/authSlice';

function MyComponent() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  
  return (
    <div>
      {isAuthenticated ? `Welcome, ${user?.firstName}!` : 'Please log in'}
    </div>
  );
}
```

### Dispatching Auth Actions

```typescript
import { useAppDispatch } from '../utils/hooks';
import { login } from '../features/auth/authSlice';

function LoginButton() {
  const dispatch = useAppDispatch();
  
  const handleLogin = async () => {
    try {
      await dispatch(login({ email: 'user@example.com', password: 'password' })).unwrap();
      // Success handling
    } catch (error) {
      // Error handling
    }
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

## API Integration

### Authentication Service

The `authService.ts` file provides an interface to the authentication API:

```typescript
import authService from '../services/authService';

// Register a user
const registerUser = async (userData) => {
  try {
    const result = await authService.register(userData);
    return result;
  } catch (error) {
    handleError(error);
  }
};
```

### Configuration

API endpoints and configuration are centralized in the `api.ts` file:

```typescript
// src/config/api.ts
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  // ...other endpoints
};
```

### Token Management

The authentication service handles token storage, refresh, and expiration:

```typescript
// Automatic token refresh
private setupTokenRefresh(expiresIn: number): void {
  // Calculate when to refresh (at 75% of token lifetime)
  const refreshTime = Math.floor(expiresIn * 0.75) * 1000;
  
  // Set timeout to refresh token
  this.refreshTimeoutId = window.setTimeout(async () => {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.refreshTokens(refreshToken);
      } catch (error) {
        // Handle refresh failure
      }
    }
  }, refreshTime);
}
```

## Error Handling

### Error Types

```typescript
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}
```

### Error Boundaries

Error boundaries catch and handle errors in the authentication flow:

```jsx
<AuthErrorBoundary>
  <Login />
</AuthErrorBoundary>
```

### Error Recovery

Components provide mechanisms for recovering from errors:

1. Display clear error messages
2. Offer retry options
3. Provide alternative authentication methods
4. Guide users to support if needed

## Testing

### Unit Tests

Unit tests for individual components using React Testing Library:

```typescript
// src/__tests__/pages/auth/Login.test.tsx
describe('Login Component', () => {
  test('renders login form', () => {
    render(<Login />);
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
  });
  
  test('shows validation errors', async () => {
    // Test validation logic
  });
  
  // More tests...
});
```

### Integration Tests

Tests for complete authentication flows:

```typescript
// src/__tests__/integration/AuthFlow.test.tsx
describe('Authentication Flow', () => {
  test('user can register, verify email, and login', async () => {
    // Test full auth flow
  });
});
```

### Testing Strategy

1. **Component tests**: Verify individual component behavior
2. **Integration tests**: Test user flows across components
3. **Redux tests**: Verify state management
4. **API mocks**: Simulate backend responses
5. **Error cases**: Test error handling and recovery

## Security Considerations

### Password Policies

Strong password requirements are enforced:

```typescript
const passwordValidation = yup
  .string()
  .min(8, 'Password should be of minimum 8 characters length')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  )
  .required('Password is required');
```

### Token Security

- Access tokens are short-lived (default: 1 hour)
- Refresh tokens have longer life (default: 7 days)
- Tokens are stored securely and refreshed automatically
- Tokens are invalidated on logout

### Secure Communication

- HTTPS is required for all API communication
- Sensitive data is never logged
- Input validation prevents injection attacks

### Best Practices

1. **Never store plain passwords**: Always hash passwords on the backend
2. **Use secure headers**: Set appropriate security headers
3. **Implement rate limiting**: Prevent brute force attacks
4. **Add MFA support**: Provide multi-factor authentication for sensitive operations
5. **Regular security audits**: Check for vulnerabilities

## Common Use Cases

### Registration and Login

Basic user registration and login flow:

```jsx
// Registration
<Route path="/register" element={<Registration />} />

// Login
<Route path="/login" element={<Login />} />
```

### Password Reset

Complete password reset flow:

```jsx
// Request reset
<Route path="/forgot-password" element={<ForgotPassword />} />

// Reset with token
<Route path="/reset-password" element={<ResetPassword />} />
```

### Protected Routes

Restrict access to authenticated users:

```jsx
<Route 
  path="/profile" 
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  } 
/>
```

### Social Authentication

Enable authentication via social providers:

```jsx
// In login component
const handleGoogleLogin = () => {
  dispatch(socialAuth({ provider: 'google', token: googleToken }));
};

<Button onClick={handleGoogleLogin}>
  Continue with Google
</Button>
```

## Configuration

### Environment Variables

```
# .env file
# API Configuration
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENV=development

# Auth Configuration
REACT_APP_TOKEN_EXPIRY=3600
REACT_APP_REFRESH_TOKEN_EXPIRY=604800
REACT_APP_PASSWORD_RESET_EXPIRY=3600
REACT_APP_EMAIL_VERIFICATION_REQUIRED=true

# Social Auth
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_FACEBOOK_APP_ID=your-facebook-app-id
```

### Feature Flags

```
# Enable/disable features
REACT_APP_ENABLE_SOCIAL_LOGIN=true
REACT_APP_ENABLE_REGISTRATION=true
```

## Deployment Considerations

### Production Setup

1. **Environment variables**: Set proper production values
2. **API endpoints**: Configure correct API URLs
3. **Error tracking**: Add monitoring services
4. **Build optimization**: Configure for production

### Security Checklist

- [ ] Use HTTPS for all communication
- [ ] Set secure cookie attributes
- [ ] Implement proper CORS configuration
- [ ] Add Content Security Policy headers
- [ ] Configure proper token expiration
- [ ] Regular security updates

### Monitoring

1. Set up error tracking with Sentry or similar tool
2. Monitor failed authentication attempts
3. Track token refresh failures
4. Set up alerts for security events

---

## Appendix

### Useful Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Router Documentation](https://reactrouter.com/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Contributing

When extending the authentication system:

1. Add comprehensive tests
2. Update documentation
3. Follow security best practices
4. Maintain type safety

