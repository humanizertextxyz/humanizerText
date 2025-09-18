import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, userData, fetchUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      const couponCode = searchParams.get('coupon');
      
      // Handle coupon-based upgrade (no session ID needed)
      if (couponCode) {
        if (!currentUser) {
          setError('Please log in to view your subscription status.');
          setLoading(false);
          return;
        }

        try {
          // Wait a moment for the backend to process the upgrade
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh user data to get updated subscription
          if (currentUser) {
            await fetchUserData(currentUser);
          }
          
          setSuccess(true);
        } catch (err) {
          console.error('Error processing coupon upgrade:', err);
          setError('There was an issue processing your upgrade. Please contact support.');
        } finally {
          setLoading(false);
        }
        return;
      }
      
      if (!sessionId) {
        setError('No session ID found. This may not be a valid payment success page.');
        setLoading(false);
        return;
      }

      if (!currentUser) {
        setError('Please log in to view your subscription status.');
        setLoading(false);
        return;
      }

      try {
        // Wait a moment for webhooks to process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Refresh user data to get updated subscription
        if (currentUser) {
          await fetchUserData(currentUser);
        }
        
        setSuccess(true);
      } catch (err) {
        console.error('Error processing success:', err);
        setError('There was an issue processing your payment. Please contact support if you were charged.');
      } finally {
        setLoading(false);
      }
    };

    handleSuccess();
  }, [searchParams, currentUser, fetchUserData]);

  const getSubscriptionDetails = () => {
    if (!userData?.subscription) return null;
    
    const subscription = userData.subscription;
    return {
      plan: subscription.type?.charAt(0).toUpperCase() + subscription.type?.slice(1) || 'Unknown',
      status: subscription.status || 'active',
    };
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 4,
            }}
          >
            <CircularProgress size={60} sx={{ color: '#6366f1', mb: 3 }} />
            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
              Processing Your Payment
            </Typography>
            <Typography color="text.secondary">
              Please wait while we confirm your subscription...
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      py: 8,
    }}>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 4,
          }}
        >
          {error ? (
            <>
              <Alert severity="error" sx={{ mb: 4 }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/pricing')}
                sx={{
                  background: 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)',
                  color: 'white',
                  fontWeight: 600,
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5855eb 30%, #7c3aed 90%)',
                  },
                }}
              >
                Back to Pricing
              </Button>
            </>
          ) : success ? (
            <>
              <CheckCircleIcon
                sx={{
                  fontSize: 80,
                  color: '#22c55e',
                  mb: 3,
                }}
              />
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 800,
                  color: 'white',
                  mb: 2,
                }}
              >
                Payment Successful!
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 4 }}
              >
                Welcome to your new {getSubscriptionDetails()?.plan} plan
              </Typography>
              
              <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Your subscription is now active!</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Plan: {getSubscriptionDetails()?.plan}<br/>
                  • Status: {getSubscriptionDetails()?.status}<br/>
                  • You now have access to all premium features
                </Typography>
              </Alert>

              <Box display="flex" gap={2} justifyContent="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                <Button
                  variant="contained"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/')}
                  sx={{
                    background: 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)',
                    color: 'white',
                    fontWeight: 600,
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5855eb 30%, #7c3aed 90%)',
                    },
                  }}
                >
                  Start Humanizing
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/account')}
                  sx={{
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    color: '#6366f1',
                    fontWeight: 600,
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      borderColor: '#6366f1',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    },
                  }}
                >
                  View Account
                </Button>
              </Box>
            </>
          ) : null}
        </Paper>
      </Container>
    </Box>
  );
};

export default Success; 