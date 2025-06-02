import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Alert, 
  CircularProgress, 
  Link,
  Divider
} from '@mui/material';
import { CheckCircleOutline, ErrorOutline, MarkEmailRead } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  verifyEmail, 
  resendVerificationEmail,
  selectIsVerifying,
  selectIsVerified,
  selectVerificationError
} from '../../features/auth/authSlice';

// Validation schema for the resend verification form
const resendValidationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
});

/**
 * Email Verification Component
 * 
 * Handles verifying a user's email address via a token in the URL.
 * Also provides a form to resend the verification email if needed.
 */
const EmailVerification = () => {
  const [showResendForm, setShowResendForm] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get verification state from Redux
  const isVerifying = useAppSelector(selectIsVerifying);
  const isVerified = useAppSelector(selectIsVerified);
  const verificationError = useAppSelector(selectVerificationError);
  
  // Parse token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    
    if (token) {
      // Dispatch verification action with token
      dispatch(verifyEmail({ token }))
        .unwrap()
        .then(() => {
          setVerificationAttempted(true);
        })
        .catch(() => {
          setVerificationAttempted(true);
        });
    }
  }, [location, dispatch]);
  
  // Setup formik for resend verification form
  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: resendValidationSchema,
    onSubmit: (values) => {
      dispatch(resendVerificationEmail({ email: values.email }))
        .unwrap()
        .then(() => {
          // Reset form after successful submission
          formik.resetForm();
          setShowResendForm(false);
        });
    },
  });
  
  // Determine content based on verification state
  const renderContent = () => {
    // If verification is in progress, show loading
    if (isVerifying) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Verifying your email...
          </Typography>
        </Box>
      );
    }
    
    // If verification was successful, show success message
    if (isVerified) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleOutline color="success" sx={{ fontSize: 80 }} />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
            Email Verified Successfully!
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>
            Your email has been verified. You can now access all features of your account.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </Box>
      );
    }
    
    // If verification failed, show error and resend option
    if (verificationError && verificationAttempted) {
      return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <ErrorOutline color="error" sx={{ fontSize: 80 }} />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
            Verification Failed
          </Typography>
          <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
            {verificationError}
          </Alert>
          
          {showResendForm ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Resend Verification Email
              </Typography>
              <form onSubmit={formik.handleSubmit}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  margin="normal"
                  disabled={isVerifying}
                />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowResendForm(false)}
                    disabled={isVerifying}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Resend Email'
                    )}
                  </Button>
                </Box>
              </form>
            </Box>
          ) : (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setShowResendForm(true)}
              >
                Resend Verification Email
              </Button>
            </Box>
          )}
        </Box>
      );
    }
    
    // Default state - no token provided
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <MarkEmailRead color="primary" sx={{ fontSize: 80 }} />
        <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
          Email Verification Required
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>
          Please check your email for a verification link, or request a new verification email below.
        </Typography>
        
        {showResendForm ? (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resend Verification Email
            </Typography>
            <form onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                margin="normal"
                disabled={isVerifying}
              />
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowResendForm(false)}
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Resend Email'
                  )}
                </Button>
              </Box>
            </form>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => setShowResendForm(true)}
            >
              Resend Verification Email
            </Button>
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {renderContent()}
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already verified? {' '}
              <Link component={RouterLink} to="/login" variant="body2" underline="hover">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerification;

