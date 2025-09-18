import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  History,
  AttachMoney,
  Home,
  AutoFixHigh,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Menu as MenuIcon,
  AccountCircle as AccountIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/', label: 'Home', icon: <Home /> },
    { path: '/history', label: 'History', icon: <History /> },
    { path: '/pricing', label: 'Pricing', icon: <AttachMoney /> },
    { path: '/guide', label: 'Guide', icon: <HelpIcon /> },
    ...(currentUser ? [{ path: '/account', label: 'My Account', icon: <AccountIcon /> }] : []),
  ];

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
          borderLeft: '1px solid rgba(99, 102, 241, 0.2)',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
            Menu
          </Typography>
          <IconButton onClick={handleMobileMenuClose} sx={{ color: 'white' }}>
            <MenuIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />
        
        <List>
          {navigationItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  backgroundColor: isActive(item.path) ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? '#6366f1' : 'rgba(255,255,255,0.7)', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isActive(item.path) ? '#6366f1' : 'white',
                      fontWeight: isActive(item.path) ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {!currentUser && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleNavigation('/login')}
                startIcon={<LoginIcon />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  textTransform: 'none',
                  py: 1.5,
                  '&:hover': {
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  },
                }}
              >
                Login
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleNavigation('/signup')}
                startIcon={<PersonAddIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  py: 1.5,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: '2px solid #fbbf24',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ py: 1 }}>
            {/* Logo/Brand - Clickable */}
            <Box 
              display="flex" 
              alignItems="center" 
              sx={{ 
                flexGrow: 1,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
                transition: 'opacity 0.3s ease',
              }}
              onClick={() => handleNavigation('/')}
            >
              <AutoFixHigh sx={{ color: 'white', mr: 2, fontSize: 32 }} />
              <Typography
                variant="h5"
                component="div"
                sx={{
                  background: 'linear-gradient(45deg, #ffffff 30%, #fbbf24 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  fontSize: { xs: '1.2rem', md: '1.5rem' },
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                HumanizerText
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box display="flex" alignItems="center" gap={4}>
                {navigationItems.map((item) => (
                  <Button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    startIcon={item.icon}
                    sx={{
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: isActive(item.path) ? 600 : 400,
                      fontSize: '1rem',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Desktop User Menu */}
            {!isMobile && (
              <Box display="flex" alignItems="center" gap={2} sx={{ ml: 4 }}>
                {currentUser ? (
                  <IconButton
                    onClick={() => handleNavigation('/account')}
                    sx={{
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#6366f1', width: 36, height: 36 }}>
                      {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </Avatar>
                  </IconButton>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => handleNavigation('/login')}
                      startIcon={<LoginIcon />}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: 'white',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleNavigation('/signup')}
                      startIcon={<PersonAddIcon />}
                      sx={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'rgba(255,255,255,0.3)',
                        },
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </Box>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="end"
                  onClick={handleMobileMenuToggle}
                  sx={{
                    transition: 'all 0.3s ease',
                    minWidth: 44,
                    minHeight: 44,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
        
        {/* Animated Border */}
        <Box
          sx={{
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, #fbbf24 50%, transparent 100%)',
            animation: 'shimmer 3s ease-in-out infinite',
            '@keyframes shimmer': {
              '0%': { transform: 'translateX(-100%)' },
              '50%': { transform: 'translateX(100%)' },
              '100%': { transform: 'translateX(-100%)' },
            },
          }}
        />
      </AppBar>

      {/* Mobile Menu Drawer */}
      {renderMobileMenu()}
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
