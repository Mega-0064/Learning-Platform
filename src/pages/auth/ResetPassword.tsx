import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Alert, 
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff, LockReset, ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  resetPassword, 
  resetPasswordState,
  selectIsResettingPassword,
  selectPasswordResetSuccess,
  selectPasswordResetError
} from '../../features/auth/authSlice';
import { ResetPasswordRequest } from '../../types/auth';

// Validation schema for the reset password form
const validationSchema = yup.object({
  password: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

/**
 * Reset Password Component
 * 
 * Allows users to set a new password using a reset token from email.
 * Validates password strength and confirms password match.
 */
const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get password reset state from Redux
  const isLoading = useAppSelector(selectIsResettingPassword);
  const resetSuccess = useAppSelector(selectPasswordResetSuccess);
  const resetError = useAppSelector(selectPasswordResetError);
  
  // Extract token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlToken = queryParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
      setTokenValid(true);
    } else {
      setTokenValid(false);
    }
    
    // Reset password state when component unmounts
    return () => {
      dispatch(resetPasswordState());
    };
  }, [location, dispatch]);
  
  // Handle password visibility toggle
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Auto-redirect to login after successful password reset
  useEffect(() => {
    let redirectTimer: number;
    
    if (resetSuccess) {
      redirectTimer = window.setTimeout(() => {
        navigate('/login');
      }, 5000); // 5 seconds delay before redirect
    }
    
    return () => {
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [resetSuccess, navigate]);
  
  // Setup formik for form management
  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
      token: token || '',
    },
    enableReinitialize: true, // Update form when token changes
    validationSchema,
    onSubmit: (values: ResetPasswordRequest) => {
      if (token) {
        const resetData: ResetPasswordRequest = {
          ...values,
          token,
        };
        dispatch(resetPassword(resetData));
      }
    },
  });
  
  // If no token is provided, show an error
  if (!tokenValid && !isLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ my: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography component="h1" variant="h4" fontWeight="bold">
                Invalid Reset Link
              </Typography>
            </Box>
            
            <Alert severity="error" sx={{ mb: 3 }}>
              The password reset link is invalid or has expired.
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 3 }}>
              Please request a new password reset link or contact support if you continue to experience issues.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                startIcon={<ArrowBack />}
                component={RouterLink}
                to="/forgot-password"
                variant="contained"
                sx={{ mr: 2 }}
              >
                Request New Link
              </Button>
              
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
              >
                Back to Login
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" fontWeight="bold">
              Reset Your Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new, strong password for your account
            </Typography>
          </Box>
          
          {/* Success Message */}
          {resetSuccess && (
            <Box sx={{ mb: 3 }}>
              <Alert 
                severity="success"
                sx={{ mb: 2 }}
              >
                Your password has been successfully reset
              </Alert>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You will be redirected to the login page in a few seconds where you can sign in with your new password.
              </Typography>
              <Button
                startIcon={<ArrowBack />}
                component={RouterLink}
                to="/login"
                variant="contained"
                sx={{ mt: 1 }}
              >
                Go to Login Now
              </Button>
            </Box>
          )}
          
          {/* Error Message */}
          {resetError && !resetSuccess && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {resetError}
            </Alert>
          )}
          
          {/* Form */}
          {!resetSuccess && (
            <form onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                margin="normal"
                disabled={isLoading}
                InputProps={{
                  startAdornment: <LockReset sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                margin="normal"
                disabled={isLoading}
                InputProps={{
                  startAdornment: <LockReset sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleClickShowConfirmPassword}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                Your password must be at least 8 characters long and include uppercase, lowercase, number, and special character.
              </Alert>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 2, mb: 2, py: 1.5 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Reset Password'
                )}
              </Button>
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">
                  Remember your password?{' '}
                  <Link component={RouterLink} to="/login" variant="body2" underline="hover">
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;

