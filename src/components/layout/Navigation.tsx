import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  BookmarkBorder as BookmarkIcon,
  Dashboard as DashboardIcon,
  ExploreOutlined as ExploreIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../utils/hooks';
import { useRoutePreload } from '../../hooks/useRoutePreload';

interface NavigationProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

/**
 * Navigation component that displays the sidebar navigation menu
 * with responsive behavior for mobile and desktop views.
 */
const Navigation = ({ drawerWidth, mobileOpen, onDrawerToggle }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  // Initialize route preloading hook
  const { handleMouseEnter, handleMouseLeave } = useRoutePreload({
    hoverDelay: 150,
    onPreloaded: (path) => {
      console.debug(`Route ${path} preloaded successfully`);
    },
  });

  // Navigation handler
  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobileOpen) {
      onDrawerToggle();
    }
  };

  // Check if the current path matches the navigation item
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Navigation menu items
  const menuItems = [
    { 
      text: 'Home', 
      icon: <HomeIcon />, 
      path: '/',
      requiresAuth: false
    },
    { 
      text: 'Courses', 
      icon: <SchoolIcon />, 
      path: '/courses',
      requiresAuth: false
    },
    { 
      text: 'Explore', 
      icon: <ExploreIcon />, 
      path: '/explore',
      requiresAuth: false
    },
    { 
      text: 'My Courses', 
      icon: <BookmarkIcon />, 
      path: '/my-courses',
      requiresAuth: true
    },
    { 
      text: 'Profile', 
      icon: <PersonIcon />, 
      path: '/profile',
      requiresAuth: true
    },
  ];

  // Admin-only items
  const adminItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/admin',
      requiresAuth: true
    },
  ];

  // Drawer content
  const drawer = (
    <div>
      {/* Drawer header with logo/title */}
      <Toolbar sx={{ 
        justifyContent: 'center', 
        py: 1,
        bgcolor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText
      }}>
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          Learning Platform
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* Navigation menu */}
      <List>
        {menuItems.map((item) => (
          // Only show items that don't require auth, or user is authenticated
          (!item.requiresAuth || isAuthenticated) && (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => handleMouseEnter(item.path)}
                onMouseLeave={handleMouseLeave}
                selected={isActive(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light,
                    },
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.contrastText,
                    }
                  }
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
      
      {/* Admin section if user is admin */}
      {isAuthenticated && user?.role === 'admin' && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography
            variant="overline"
            sx={{ pl: 2, opacity: 0.7, display: 'block', mt: 1 }}
          >
            Admin
          </Typography>
          
          <List>
            {adminItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigation(item.path)}
                  onMouseEnter={() => handleMouseEnter(item.path)}
                  onMouseLeave={handleMouseLeave}
                  selected={isActive(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.contrastText,
                      }
                    }
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="navigation menu"
    >
      {/* Mobile drawer - temporary, closes when clicking outside */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer - permanent */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Navigation;

