import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { theme } from './utils/theme';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary, { ErrorType } from './components/common/ErrorBoundary';
import LoadingOverlay from './components/common/LoadingOverlay';
import { useAppSelector, useAppDispatch } from './utils/hooks';
import { selectAuthLoading, resetPasswordState, clearAuthErrors } from './features/auth/authSlice';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

// Import preloadable routes
import { routes, preloadEssentialRoutes } from './utils/preloadRoutes';

// Use preloadable components instead of direct lazy loading
const Home = routes.home.component;
const Courses = routes.courses.component;
const Profile = routes.profile.component;
const Login = routes.login.component;
const Registration = routes.registration.component;
const EmailVerification = routes.emailVerification.component;
const ForgotPassword = routes.forgotPassword.component;
const ResetPassword = routes.resetPassword.component;
const ChangePassword = routes.changePassword.component;

// Auth-specific error boundary component wrapper
interface AuthErrorProps {
  children: React.ReactNode;
}

const AuthErrorBoundary: React.FC<AuthErrorProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const handleAuthError = (error: Error) => {
    console.error('Auth error caught:', error);
    // Clear any auth errors in the Redux store
    dispatch(clearAuthErrors());
    // For password reset errors, also reset the password state
    dispatch(resetPasswordState());
  };
  
  const handleReset = () => {
    // Navigate to login when retry is clicked
    navigate('/login');
  };
  
  return (
    <ErrorBoundary 
      type={ErrorType.AUTHENTICATION} 
      onError={handleAuthError}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundary>
  );
};

// Main layout with loading overlay
const MainLayoutWithLoading: React.FC = () => {
  const isLoading = useAppSelector(selectAuthLoading);
  
  return (
    <LoadingOverlay 
      loading={isLoading} 
      fullScreen 
      message="Loading your content..."
      timeout={15000}
    >
      <MainLayout />
    </LoadingOverlay>
  );
};

// Component to handle initial route preloading
const RoutePreloader = () => {
  useEffect(() => {
    // Preload essential routes after initial render
    const preloadTimeout = setTimeout(() => {
      preloadEssentialRoutes()
        .then(() => {
          console.debug('Essential routes preloaded successfully');
        })
        .catch((error) => {
          console.error('Failed to preload essential routes:', error);
        });
    }, 1000); // Start preloading after 1 second to not block initial rendering
    
    return () => {
      clearTimeout(preloadTimeout);
    };
  }, []);
  
  return null;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary type={ErrorType.UNKNOWN}>
        <Router>
          <RoutePreloader />
          <Suspense fallback={<LoadingOverlay loading={true} fullScreen message="Loading..." />}>
            <Routes>
          {/* Public auth routes with auth-specific error handling */}
          <Route path="/login" element={
            <AuthErrorBoundary>
              <LoadingOverlay loading={false} fullScreen={false}>
                <Login />
              </LoadingOverlay>
            </AuthErrorBoundary>
          } />
          <Route path="/register" element={
            <AuthErrorBoundary>
              <LoadingOverlay loading={false} fullScreen={false}>
                <Registration />
              </LoadingOverlay>
            </AuthErrorBoundary>
          } />
          <Route path="/verify-email" element={
            <AuthErrorBoundary>
              <EmailVerification />
            </AuthErrorBoundary>
          } />
          <Route path="/forgot-password" element={
            <AuthErrorBoundary>
              <ForgotPassword />
            </AuthErrorBoundary>
          } />
          <Route path="/reset-password" element={
            <AuthErrorBoundary>
              <ResetPassword />
            </AuthErrorBoundary>
          } />
          
          {/* Routes with MainLayout with loading overlay */}
          <Route path="/" element={
            <ErrorBoundary>
              <MainLayoutWithLoading />
            </ErrorBoundary>
          }>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            
            {/* Protected routes with auth-specific error handling */}
            <Route path="profile" element={
              <ProtectedRoute>
                <AuthErrorBoundary>
                  <Profile />
                </AuthErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="change-password" element={
              <ProtectedRoute>
                <AuthErrorBoundary>
                  <ChangePassword />
                </AuthErrorBoundary>
              </ProtectedRoute>
            } />
          </Route>
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
