import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  AutoFixHigh as AutoFixHighIcon,
  AttachMoney as AttachMoneyIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getSubscriptionTier, getPlanColor } from '../utils/subscription';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const Account: React.FC = () => {
  const { currentUser, userData, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [localUserData, setLocalUserData] = useState(userData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser && !userData) {
        try {
          setIsLoading(true);
          // Use same sanitization function as AuthContext
          const sanitizedEmail = currentUser.email!.replace(/[\.#$\[\]@]/g, (match) => {
        if (match === '@') return '_at_';
        return '_';
      });
          const userDoc = await getDoc(doc(db, 'users', sanitizedEmail));
          if (userDoc.exists()) {
            setLocalUserData(userDoc.data() as any);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (userData) {
        setLocalUserData(userData);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, userData]);

  if (loading || isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Box textAlign="center">
          <CircularProgress sx={{ color: '#6366f1', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading account information...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Typography variant="h6" color="text.secondary">
          Please log in to view your account.
        </Typography>
      </Box>
    );
  }

  const tier = getSubscriptionTier(localUserData?.subscription.type || 'free');
  const dailyWordsUsed = localUserData?.usage.dailyWordsUsed || 0;
  const monthlyWordsUsed = localUserData?.usage.monthlyWordsUsed || 0;
  const wordsRemaining = tier.type === 'free' ? tier.dailyWords - dailyWordsUsed : tier.monthlyWords - monthlyWordsUsed;
  const wordsPerProcess = tier.wordsPerProcess;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      py: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="lg">
        {/* Page Title */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
              background: 'linear-gradient(45deg, #ffffff 30%, #fbbf24 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            My Account
          </Typography>
        </Box>

        {/* Two Column Layout - Account Details and Usage Statistics */}
        <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
          {/* Left Column - Account Details */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              flex: 1,
              position: 'relative',
              minHeight: { xs: 'auto', lg: '500px' },
            }}
          >
            {/* User Info Header */}
            <Box 
              display="flex" 
              alignItems="center" 
              gap={3} 
              mb={4}
              flexDirection={{ xs: 'column', sm: 'row' }}
              textAlign={{ xs: 'center', sm: 'left' }}
            >
              <Avatar
                sx={{
                  width: { xs: 80, md: 80 },
                  height: { xs: 80, md: 80 },
                  bgcolor: '#6366f1',
                  fontSize: { xs: '2rem', md: '2rem' },
                  fontWeight: 700,
                }}
              >
                {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  {currentUser.displayName || 'User'}
                </Typography>
                <Chip
                  label={tier.name.toUpperCase()}
                  sx={{
                    backgroundColor: `${getPlanColor(tier.type)}20`,
                    color: getPlanColor(tier.type),
                    border: `1px solid ${getPlanColor(tier.type)}40`,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 28,
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 4 }} />

            {/* User Details */}
            <Box display="flex" flexDirection="column" gap={3} mb={4}>
              {/* Email */}
              <Box display="flex" alignItems="center" gap={2}>
                <EmailIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {currentUser.email}
                  </Typography>
                </Box>
              </Box>

              {/* Member Since */}
              <Box display="flex" alignItems="center" gap={2}>
                <CalendarIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Member Since
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {localUserData?.createdAt ? new Date(localUserData.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Unknown'}
                  </Typography>
                </Box>
              </Box>

              {/* Subscription Status */}
              <Box display="flex" alignItems="center" gap={2}>
                <AutoFixHighIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Subscription Status
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {localUserData?.subscription.status ? 
                      localUserData.subscription.status.charAt(0).toUpperCase() + localUserData.subscription.status.slice(1) : 
                      'Free'
                    }
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Logout Button - Properly positioned */}
            <Box 
              sx={{
                position: { xs: 'static', lg: 'absolute' },
                bottom: { lg: 16 },
                left: { lg: 16 },
                right: { lg: 16 },
                mt: { xs: 2, lg: 0 },
              }}
            >
              <Button
                variant="outlined"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                fullWidth
                sx={{
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  color: '#ef4444',
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          </Paper>

          {/* Right Column - Usage Statistics */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              flex: 1,
              position: 'relative',
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 4, fontSize: { xs: '1.3rem', md: '1.5rem' } }}>
              Usage Statistics
            </Typography>

            <Box display="flex" flexDirection="column" gap={4}>
              {/* Words Remaining */}
              <Box>
                <Typography variant="h3" sx={{ color: '#22c55e', fontWeight: 700, mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
                  {wordsRemaining.toLocaleString()}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', mb: 1, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  Words remaining {tier.type === 'free' ? 'today' : 'this month'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                  {tier.type === 'free' ? 'Daily' : 'Monthly'} limit: {tier.type === 'free' ? tier.dailyWords.toLocaleString() : tier.monthlyWords.toLocaleString()} words
                </Typography>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

              {/* Max Words Per Process */}
              <Box>
                <Typography variant="h3" sx={{ color: '#fbbf24', fontWeight: 700, mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
                  {wordsPerProcess === 0 ? '∞' : wordsPerProcess.toLocaleString()}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', mb: 1, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  Max words per process
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                  Maximum text length for humanization
                </Typography>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

              {/* Total Words Used */}
              <Box>
                <Typography variant="h3" sx={{ color: '#6366f1', fontWeight: 700, mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
                  {tier.type === 'free' ? dailyWordsUsed.toLocaleString() : monthlyWordsUsed.toLocaleString()}
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', mb: 1, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  Total words used
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                  {tier.type === 'free' ? 'Today' : 'This month'}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AttachMoneyIcon />}
                onClick={() => navigate('/pricing')}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', md: '0.9rem' },
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Upgrade Plan
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Legal Links */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
            Legal Information
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="text"
              onClick={() => navigate('/terms')}
              sx={{
                color: '#6366f1',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
              }}
            >
              Terms of Service
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/privacy')}
              sx={{
                color: '#6366f1',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
              }}
            >
              Privacy Policy
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Account;
