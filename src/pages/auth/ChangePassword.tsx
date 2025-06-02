import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined, 
  KeyOutlined, 
  CheckCircleOutline,
  ArrowBack
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  changePassword, 
  resetPasswordState,
  selectIsResettingPassword,
  selectPasswordResetSuccess,
  selectPasswordResetError,
  selectCurrentUser
} from '../../features/auth/authSlice';
import { ChangePasswordRequest } from '../../types/auth';

// Validation schema for changing password
const validationSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .notOneOf([yup.ref('currentPassword')], 'New password must be different from current password')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

/**
 * Change Password Component
 * 
 * Allows authenticated users to change their password.
 * Requires current password verification for security.
 */
const ChangePassword = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get user and password change state from Redux
  const user = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectIsResettingPassword);
  const changeSuccess = useAppSelector(selectPasswordResetSuccess);
  const changeError = useAppSelector(selectPasswordResetError);
  
  // Reset password state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetPasswordState());
    };
  }, [dispatch]);
  
  // Handle password visibility toggles
  const handleClickShowCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };
  
  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };
  
  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Setup formik for form management
  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: (values: ChangePasswordRequest) => {
      dispatch(changePassword(values));
    },
  });
  
  // Reset form after successful password change
  useEffect(() => {
    if (changeSuccess) {
      formik.resetForm();
    }
  }, [changeSuccess, formik]);
  
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={3}>
          {/* User info sidebar */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.firstName} ${user.lastName}`}
                      style={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <LockOutlined sx={{ fontSize: 80, color: 'primary.main' }} />
                  )}
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  {user?.firstName} {user?.lastName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>
                
                <Button
                  startIcon={<ArrowBack />}
                  component={RouterLink}
                  to="/profile"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                >
                  Back to Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Password change form */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography component="h1" variant="h4" fontWeight="bold">
                  Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Update your password to keep your account secure
                </Typography>
              </Box>
              
              {/* Success Message */}
              {changeSuccess && (
                <Box sx={{ mb: 3 }}>
                  <Alert 
                    severity="success"
                    icon={<CheckCircleOutline fontSize="inherit" />}
                    sx={{ mb: 2 }}
                  >
                    Your password has been successfully changed
                  </Alert>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Your password has been updated. You can continue using your account with the new password.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      component={RouterLink}
                      to="/profile"
                      variant="contained"
                    >
                      Back to Profile
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={() => dispatch(resetPasswordState())}
                    >
                      Change Again
                    </Button>
                  </Box>
                </Box>
              )}
              
              {/* Error Message */}
              {changeError && !changeSuccess && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {changeError}
                </Alert>
              )}
              
              {/* Form */}
              {!changeSuccess && (
                <form onSubmit={formik.handleSubmit}>
                  <TextField
                    fullWidth
                    id="currentPassword"
                    name="currentPassword"
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formik.values.currentPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
                    helperText={formik.touched.currentPassword && formik.errors.currentPassword}
                    margin="normal"
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: <KeyOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle current password visibility"
                            onClick={handleClickShowCurrentPassword}
                            edge="end"
                            disabled={isLoading}
                          >
                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <TextField
                    fullWidth
                    id="newPassword"
                    name="newPassword"
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                    helperText={formik.touched.newPassword && formik.errors.newPassword}
                    margin="normal"
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: <LockOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle new password visibility"
                            onClick={handleClickShowNewPassword}
                            edge="end"
                            disabled={isLoading}
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
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
                      startAdornment: <LockOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
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
                    Your new password must be at least 8 characters long and include uppercase, lowercase, number, and special character.
                  </Alert>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                      component={RouterLink}
                      to="/profile"
                      variant="outlined"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      sx={{ minWidth: 150 }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </Box>
                </form>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ChangePassword;

