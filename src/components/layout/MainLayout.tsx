import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Header from './Header';
import Navigation from './Navigation';

// Drawer width for the sidebar
const drawerWidth = 240;

/**
 * MainLayout component that includes the header, navigation drawer,
 * and main content area for the application.
 * Handles responsive behavior for mobile and desktop views.
 */
const MainLayout = () => {
  // State for mobile drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);

  // Toggle drawer in mobile view
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header component */}
      <Header 
        drawerWidth={drawerWidth} 
        onDrawerToggle={handleDrawerToggle} 
      />
      
      {/* Navigation sidebar */}
      <Navigation 
        drawerWidth={drawerWidth} 
        mobileOpen={mobileOpen} 
        onDrawerToggle={handleDrawerToggle} 
      />
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        {/* Toolbar spacer to prevent content from going under the app bar */}
        <Box sx={{ height: 64 }} />
        
        {/* Router outlet for page content */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;

