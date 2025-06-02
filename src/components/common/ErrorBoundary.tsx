import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container, 
  Divider, 
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import { 
  ErrorOutline, 
  Refresh, 
  ArrowBack, 
  Home, 
  Code, 
  ExpandMore, 
  ExpandLess 
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// Error types
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

// Props for the ErrorBoundary component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  type?: ErrorType;
}

// State for the ErrorBoundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // Reset the error boundary state
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call the onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  // Toggle showing error details
  toggleDetails = (): void => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  // Get a user-friendly error message based on the error type
  getErrorMessage = (): string => {
    const { type } = this.props;
    const { error } = this.state;
    
    if (error?.message) {
      return error.message;
    }
    
    switch (type) {
      case ErrorType.NETWORK:
        return 'Network error. Please check your internet connection and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication error. Please sign in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to access this resource.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.SERVER:
        return 'Server error. Our team has been notified and is working on a fix.';
      case ErrorType.VALIDATION:
        return 'There was an error with the data you provided. Please check and try again.';
      default:
        return 'Something went wrong. Please try again later.';
    }
  };

  render() {
    const { children, fallback, type } = this.props;
    const { hasError, error, errorInfo, showDetails } = this.state;
    
    if (!hasError) {
      return children;
    }
    
    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }
    
    // Default error UI
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <ErrorOutline color="error" sx={{ fontSize: 80, mb: 2 }} />
            
            <Typography variant="h4" gutterBottom fontWeight="bold">
              {type === ErrorType.NOT_FOUND ? 'Page Not Found' : 'Something Went Wrong'}
            </Typography>
            
            <Alert severity="error" sx={{ my: 2 }}>
              {this.getErrorMessage()}
            </Alert>
            
            <Box sx={{ my: 3 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleReset}
                startIcon={<Refresh />}
                sx={{ mx: 1 }}
              >
                Try Again
              </Button>
              
              <Button
                component={RouterLink}
                to="/"
                variant="outlined"
                startIcon={<Home />}
                sx={{ mx: 1 }}
              >
                Go to Home
              </Button>
              
              {(type === ErrorType.AUTHENTICATION || type === ErrorType.AUTHORIZATION) && (
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  sx={{ mx: 1, mt: { xs: 2, sm: 0 } }}
                >
                  Back to Login
                </Button>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Technical details section (for developers) */}
            <Box sx={{ textAlign: 'left' }}>
              <Button 
                onClick={this.toggleDetails}
                startIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                endIcon={<Code />}
                size="small"
                color="inherit"
                sx={{ mb: 1 }}
              >
                {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
              </Button>
              
              <Collapse in={showDetails}>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.100' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error: {error?.toString()}
                  </Typography>
                  
                  {errorInfo && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Component Stack:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        component="pre" 
                        sx={{ 
                          overflowX: 'auto', 
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.75rem',
                          p: 1,
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          borderRadius: 1
                        }}
                      >
                        {errorInfo.componentStack}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Collapse>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }
}

export default ErrorBoundary;

