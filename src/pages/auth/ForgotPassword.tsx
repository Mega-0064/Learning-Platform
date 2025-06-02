import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Divider
} from '@mui/material';
import { MailOutline, ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  forgotPassword, 
  resetPasswordState,
  selectIsResettingPassword,
  selectPasswordResetSuccess,
  selectPasswordResetError
} from '../../features/auth/authSlice';
import { ForgotPasswordRequest } from '../../types/auth';

// Validation schema for the forgot password form
const validationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
});

/**
 * Forgot Password Component
 * 
 * Allows users to request a password reset by providing their email address.
 * Sends a reset link to the user's email when submitted.
 */
const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  
  // Get password reset state from Redux
  const isLoading = useAppSelector(selectIsResettingPassword);
  const resetSuccess = useAppSelector(selectPasswordResetSuccess);
  const resetError = useAppSelector(selectPasswordResetError);
  
  // Reset password state when component unmounts
  useState(() => {
    return () => {
      dispatch(resetPasswordState());
    };
  });
  
  // Setup formik for form management
  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: (values: ForgotPasswordRequest) => {
      dispatch(forgotPassword(values));
    },
  });
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" fontWeight="bold">
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your email to receive password reset instructions
            </Typography>
          </Box>
          
          {/* Success Message */}
          {resetSuccess && (
            <Box sx={{ mb: 3 }}>
              <Alert 
                severity="success"
                sx={{ mb: 2 }}
              >
                Password reset instructions have been sent to your email
              </Alert>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Please check your inbox (and spam folder) for an email containing a link to reset your password.
                The link will expire in 1 hour.
              </Typography>
              <Button
                startIcon={<ArrowBack />}
                component={RouterLink}
                to="/login"
                sx={{ mt: 1 }}
              >
                Back to Login
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
                id="email"
                name="email"
                label="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                margin="normal"
                disabled={isLoading}
                InputProps={{
                  startAdornment: <MailOutline sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Send Reset Instructions'
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

export default ForgotPassword;

