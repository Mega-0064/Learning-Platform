import { useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  Backdrop, 
  CircularProgress, 
  Typography, 
  Box, 
  LinearProgress, 
  Paper, 
  Button,
  Fade,
  useTheme
} from '@mui/material';
import { Refresh, Warning } from '@mui/icons-material';

// Props for the LoadingOverlay component
interface LoadingOverlayProps {
  loading: boolean;
  children?: ReactNode;
  message?: string;
  fullScreen?: boolean;
  timeout?: number;
  variant?: 'circular' | 'linear' | 'dots';
  transparent?: boolean;
  onTimeout?: () => void;
}

/**
 * Loading Overlay Component
 * 
 * Displays a loading indicator over content during async operations.
 * Supports different loading indicators, timeouts, and retry functionality.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  message = 'Loading...',
  fullScreen = false,
  timeout = 30000, // 30 seconds default timeout
  variant = 'circular',
  transparent = false,
  onTimeout
}) => {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const theme = useTheme();
  
  // Reset timeout state when loading changes
  useEffect(() => {
    if (loading) {
      setIsTimedOut(false);
      setProgress(0);
    }
  }, [loading]);
  
  // Handle timeout
  useEffect(() => {
    let timeoutId: number;
    let progressInterval: number;
    
    if (loading && timeout > 0) {
      // Set timeout for the loading operation
      timeoutId = window.setTimeout(() => {
        setIsTimedOut(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);
      
      // Update progress indicator every second
      progressInterval = window.setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = prevProgress + (100 / (timeout / 1000));
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 1000);
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (progressInterval) window.clearInterval(progressInterval);
    };
  }, [loading, timeout, onTimeout]);
  
  // Retry handler
  const handleRetry = useCallback(() => {
    setIsTimedOut(false);
    setProgress(0);
    if (onTimeout) {
      onTimeout();
    }
  }, [onTimeout]);
  
  // Dots animation component (for variant='dots')
  const LoadingDots = () => {
    const [dots, setDots] = useState('');
    
    useEffect(() => {
      const intervalId = setInterval(() => {
        setDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);
      
      return () => clearInterval(intervalId);
    }, []);
    
    return (
      <Typography 
        variant="h6" 
        sx={{ 
          minWidth: '7rem',
          textAlign: 'left',
          fontFamily: 'monospace'
        }}
      >
        {message.replace(/\.$/, '')}<span style={{ width: '3ch', display: 'inline-block' }}>{dots}</span>
      </Typography>
    );
  };
  
  // Render nothing if not loading
  if (!loading && !isTimedOut) {
    return <>{children}</>;
  }
  
  // Content to show inside the overlay
  const overlayContent = (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        p: 3
      }}
    >
      {isTimedOut ? (
        // Timeout view
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            maxWidth: 400
          }}
        >
          <Warning color="warning" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Operation Timed Out
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            The request is taking longer than expected. Please check your connection and try again.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Refresh />}
            onClick={handleRetry}
          >
            Retry
          </Button>
        </Paper>
      ) : (
        // Loading indicators
        <>
          {variant === 'circular' && (
            <CircularProgress 
              size={64} 
              thickness={4} 
              color="primary" 
              variant="indeterminate" 
            />
          )}
          
          {variant === 'dots' && <LoadingDots />}
          
          {variant !== 'dots' && message && (
            <Typography 
              variant="h6" 
              color="inherit" 
              sx={{ mt: 2, mb: 1 }}
            >
              {message}
            </Typography>
          )}
          
          {variant === 'linear' && (
            <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 10, borderRadius: 5 }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="right" 
                sx={{ mt: 0.5 }}
              >
                {Math.round(progress)}%
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
  
  // Render full screen overlay
  if (fullScreen) {
    return (
      <>
        {children}
        <Backdrop
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: transparent 
              ? 'rgba(255, 255, 255, 0.7)' 
              : 'rgba(0, 0, 0, 0.8)',
            color: transparent ? 'primary.main' : 'white',
          }}
          open={loading || isTimedOut}
        >
          {overlayContent}
        </Backdrop>
      </>
    );
  }
  
  // Render inline overlay
  return (
    <Box sx={{ position: 'relative', minHeight: 100 }}>
      <Fade in={!loading && !isTimedOut}>
        <Box sx={{ visibility: loading || isTimedOut ? 'hidden' : 'visible' }}>
          {children}
        </Box>
      </Fade>
      
      <Fade in={loading || isTimedOut}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: loading || isTimedOut ? 'flex' : 'none',
            backgroundColor: transparent 
              ? 'rgba(255, 255, 255, 0.7)' 
              : 'rgba(0, 0, 0, 0.7)',
            color: transparent ? 'primary.main' : 'white',
            zIndex: 1,
            borderRadius: 1,
          }}
        >
          {overlayContent}
        </Box>
      </Fade>
    </Box>
  );
};

export default LoadingOverlay;

