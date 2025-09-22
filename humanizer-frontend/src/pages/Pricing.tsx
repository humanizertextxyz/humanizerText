import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Check as CheckIcon,
  AutoFixHigh as AutoFixHighIcon,
  TrendingUp as TrendingUpIcon,
  Rocket as RocketIcon,
  Diamond as DiamondIcon,
  LocalOffer as CouponIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_TIERS } from '../utils/subscription';
import { redirectToCheckout } from '../utils/stripe';

const Pricing: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponType, setCouponType] = useState<string | null>(null);
  const [couponDescription, setCouponDescription] = useState<string | null>(null);
  const [showCouponField, setShowCouponField] = useState(false);

  // Get current user's subscription type
  const currentSubscription = userData?.subscription?.type || 'free';

  // Price calculation functions
  const getPrice = (tierType: string) => {
    const prices = {
      free: { monthly: 0, yearly: 0 },
      pro: { monthly: 9.99, yearly: 99.90 },
      premium: { monthly: 19.99, yearly: 199.90 },
      platinum: { monthly: 49.99, yearly: 499.90 },
    };
    return prices[tierType as keyof typeof prices] || { monthly: 0, yearly: 0 };
  };

  const formatPrice = (tierType: string) => {
    if (tierType === 'free') return '$0';
    const price = getPrice(tierType);
    const currentPrice = isYearly ? price.yearly : price.monthly;
    const period = isYearly ? '/year' : '/month';
    return `$${currentPrice}${period}`;
  };

  const getSavings = (tierType: string) => {
    if (tierType === 'free') return null;
    const price = getPrice(tierType);
    const monthlyCost = price.monthly * 12;
    const yearlyCost = price.yearly;
    const savings = monthlyCost - yearlyCost;
    return savings;
  };

  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponValid(null);
      setCouponDiscount(null);
      return;
    }

    setCouponLoading(true);
    try {
      const response = await fetch(process.env.REACT_APP_VALIDATE_COUPON_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: code,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.valid) {
        setCouponValid(true);
        setCouponDiscount(data.discount);
        setCouponType(data.type);
        setCouponDescription(data.description);
      } else {
        setCouponValid(false);
        setCouponDiscount(null);
        setCouponType(null);
        setCouponDescription(null);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponValid(false);
      setCouponDiscount(null);
      setCouponType(null);
      setCouponDescription(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    await validateCoupon(couponCode);
  };

  const handleSelectPlan = async (planType: string) => {
    if (!currentUser) {
      // Redirect to signup if not authenticated
      navigate('/signup');
      return;
    }
    
    // Don't do anything if it's their current plan
    if (planType === currentSubscription) {
      return;
    }

    if (planType === 'free') {
      // Free plan doesn't need Stripe checkout
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const interval = isYearly ? 'yearly' : 'monthly';
      await redirectToCheckout(planType, interval, currentUser.email!, couponValid ? couponCode : undefined);
    } catch (err) {
      console.error('Error starting checkout:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'free': return <AutoFixHighIcon />;
      case 'pro': return <TrendingUpIcon />;
      case 'premium': return <RocketIcon />;
      case 'platinum': return <DiamondIcon />;
      default: return <AutoFixHighIcon />;
    }
  };

  const getPlanColor = (type: string) => {
    switch (type) {
      case 'free': return '#6b7280';
      case 'pro': return '#3b82f6';
      case 'premium': return '#8b5cf6';
      case 'platinum': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getButtonText = (planType: string) => {
    if (!currentUser) {
      return planType === 'free' ? 'Get Started Free' : 'Sign Up to Upgrade';
    }
    
    if (planType === currentSubscription) {
      return 'Current Plan';
    }
    
    return planType === 'free' ? 'Get Started Free' : `Upgrade to ${SUBSCRIPTION_TIERS[planType].name}`;
  };

  const isButtonDisabled = (planType: string): boolean => {
    return Boolean(currentUser && planType === currentSubscription);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      py: 8,
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(45deg, #ffffff 30%, #fbbf24 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              mb: 3,
            }}
          >
            Choose Your Plan
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              fontWeight: 400,
              opacity: 0.8,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Unlock the full potential of AI text humanization with our flexible pricing plans
          </Typography>
          
          {/* Current Plan Indicator */}
          {currentUser && (
            <Box mt={3}>
              <Chip
                label={`Current Plan: ${SUBSCRIPTION_TIERS[currentSubscription].name}`}
                sx={{
                  backgroundColor: `${getPlanColor(currentSubscription)}20`,
                  color: getPlanColor(currentSubscription),
                  border: `1px solid ${getPlanColor(currentSubscription)}40`,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  py: 2,
                  px: 3,
                }}
              />
            </Box>
          )}
        </Box>

        {/* Coupon Code Section */}
        <Box display="flex" justifyContent="flex-start" mb={4}>
          <Box maxWidth={400} width="100%">
            {!showCouponField ? (
              <Box display="flex" justifyContent="center">
                <Button
                  variant="text"
                  startIcon={<CouponIcon />}
                  onClick={() => setShowCouponField(true)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  Have a coupon code?
                </Button>
              </Box>
            ) : (
              <Collapse in={showCouponField}>
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(26, 26, 46, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 2,
                  }}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                      Apply Coupon Code
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        setShowCouponField(false);
                        setCouponCode('');
                        setCouponValid(null);
                        setCouponDiscount(null);
                        setCouponType(null);
                        setCouponDescription(null);
                      }}
                      sx={{ minWidth: 'auto', p: 1, color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      <CloseIcon fontSize="small" />
                    </Button>
                  </Box>
                  
                  <Box display="flex" gap={2} alignItems="flex-start">
                    <TextField
                      fullWidth
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyCoupon();
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CouponIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: couponValid === true 
                              ? '#4ade80' 
                              : couponValid === false 
                              ? '#ef4444' 
                              : 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: couponValid === true 
                              ? '#4ade80' 
                              : couponValid === false 
                              ? '#ef4444' 
                              : 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: couponValid === true 
                              ? '#4ade80' 
                              : couponValid === false 
                              ? '#ef4444' 
                              : '#6366f1',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(255, 255, 255, 0.5)',
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: 100,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        },
                        '&:disabled': {
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.5)',
                        },
                      }}
                    >
                      {couponLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </Box>
                  
                  {couponValid === true && couponDiscount && (
                    <Alert 
                      severity="success" 
                      sx={{ 
                        mt: 2,
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        color: '#4ade80',
                        '& .MuiAlert-icon': {
                          color: '#4ade80',
                        },
                      }}
                    >
                      🎉 Coupon applied! {couponDescription || `${couponDiscount}${couponType === 'percentage' ? '%' : '$'} off`} will be applied at checkout.
                    </Alert>
                  )}
                  
                  {couponValid === false && couponCode.trim() && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 2,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        '& .MuiAlert-icon': {
                          color: '#ef4444',
                        },
                      }}
                    >
                      Invalid coupon code. Please check and try again.
                    </Alert>
                  )}
                </Paper>
              </Collapse>
            )}
          </Box>
        </Box>

        {/* Billing Toggle - Centered */}
        <Box textAlign="center" mb={6}>
          <FormControlLabel
            control={
              <Switch
                checked={isYearly}
                onChange={(e) => setIsYearly(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#6366f1',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#6366f1',
                  },
                }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={2}>
                <Typography 
                  sx={{ 
                    color: !isYearly ? '#6366f1' : 'text.secondary', 
                    fontWeight: !isYearly ? 600 : 400,
                    transition: 'all 0.3s ease-in-out',
                    transform: !isYearly ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  Monthly
                </Typography>
                <Typography 
                  sx={{ 
                    color: isYearly ? '#6366f1' : 'text.secondary', 
                    fontWeight: isYearly ? 600 : 400,
                    transition: 'all 0.3s ease-in-out',
                    transform: isYearly ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  Yearly
                </Typography>
                <Box
                  sx={{
                    height: isYearly ? 28 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isYearly ? 1 : 0,
                    transform: isYearly ? 'translateX(0)' : 'translateX(-20px)',
                  }}
                >
                  <Chip
                    label="Save up to $40!"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22c55e',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  />
                </Box>
              </Box>
            }
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '1.1rem',
              },
            }}
          />
        </Box>

        {/* Error Display */}
        {error && (
          <Box mb={4} display="flex" justifyContent="center">
            <Alert severity="error" sx={{ maxWidth: 500 }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box mb={4} display="flex" justifyContent="center" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography>Redirecting to checkout...</Typography>
          </Box>
        )}

        {/* Pricing Cards */}
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', md: 'row' }} 
          gap={4} 
          justifyContent="center"
          alignItems="stretch"
          sx={{ 
            mb: 8,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)',
            opacity: 1,
          }}
        >
          {Object.values(SUBSCRIPTION_TIERS).map((tier) => {
            const isCurrentPlan = currentUser && tier.type === currentSubscription;
            
            return (
              <Box
                key={tier.type}
                sx={{
                  flex: 1,
                  maxWidth: 320,
                  minWidth: 280,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    background: isCurrentPlan 
                      ? `rgba(${getPlanColor(tier.type)}20, 0.1)` 
                      : 'rgba(26, 26, 46, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: isCurrentPlan 
                      ? `2px solid ${getPlanColor(tier.type)}` 
                      : tier.type === 'premium' ? '2px solid #8b5cf6' : '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 4,
                    boxShadow: isCurrentPlan 
                      ? `0 8px 32px ${getPlanColor(tier.type)}40` 
                      : tier.type === 'premium' ? '0 8px 32px rgba(139, 92, 246, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0) scale(1)',
                    '&:hover': !isCurrentPlan ? {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: tier.type === 'premium' 
                        ? '0 20px 60px rgba(139, 92, 246, 0.6)' 
                        : '0 20px 60px rgba(99, 102, 241, 0.3)',
                    } : {},
                  }}
                >
                  {/* Popular Badge or Current Plan Badge */}
                  {tier.type === 'premium' && !isCurrentPlan && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600,
                        zIndex: 1,
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                      }}
                    />
                  )}
                  
                  {isCurrentPlan && (
                    <Chip
                      label="Current Plan"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600,
                        zIndex: 1,
                        backgroundColor: getPlanColor(tier.type),
                        color: 'white',
                      }}
                    />
                  )}

                  {/* Plan Header */}
                  <Box textAlign="center" mb={4}>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center" 
                      mb={3}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: `${getPlanColor(tier.type)}20`,
                        border: `2px solid ${getPlanColor(tier.type)}40`,
                        mx: 'auto',
                      }}
                    >
                      {React.cloneElement(getPlanIcon(tier.type), {
                        sx: { 
                          fontSize: 30, 
                          color: getPlanColor(tier.type),
                        }
                      })}
                    </Box>
                    
                    <Typography
                      variant="h4"
                      component="h3"
                      sx={{
                        fontWeight: 700,
                        color: 'white',
                        mb: 2,
                      }}
                    >
                      {tier.name}
                    </Typography>
                    
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mb={2}>
                      <Box display="flex" alignItems="baseline" justifyContent="center">
                        <Typography
                          variant="h2"
                          component="span"
                          sx={{
                            fontWeight: 800,
                            color: 'white',
                            fontSize: '3rem',
                            transition: 'all 0.3s ease-in-out',
                          }}
                        >
                          {formatPrice(tier.type).split('/')[0]}
                        </Typography>
                        {tier.type !== 'free' && (
                          <Typography
                            variant="h6"
                            component="span"
                            sx={{
                              color: 'text.secondary',
                              ml: 1,
                              transition: 'all 0.3s ease-in-out',
                            }}
                          >
                            {formatPrice(tier.type).split('/')[1] ? `/${formatPrice(tier.type).split('/')[1]}` : ''}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Animated Savings Chip */}
                      <Box
                        sx={{
                          height: isYearly && tier.type !== 'free' ? 32 : 0,
                          overflow: 'hidden',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: isYearly && tier.type !== 'free' ? 1 : 0,
                          transform: isYearly && tier.type !== 'free' ? 'translateY(0)' : 'translateY(-10px)',
                          mt: isYearly && tier.type !== 'free' ? 1 : 0,
                        }}
                      >
                        {tier.type !== 'free' && (
                          <Chip
                            label={`Save $${getSavings(tier.type)?.toFixed(0)}`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(34, 197, 94, 0.2)',
                              color: '#22c55e',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              transition: 'all 0.3s ease-in-out',
                              '&:hover': {
                                backgroundColor: 'rgba(34, 197, 94, 0.3)',
                              }
                            }}
                          />
                        )}
                      </Box>
                      
                      {/* Monthly equivalent for yearly plans */}
                      {isYearly && tier.type !== 'free' && (
                        <Box
                          sx={{
                            opacity: 0.7,
                            transform: 'translateY(0)',
                            transition: 'all 0.3s ease-in-out',
                            mt: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          >
                            ${(getPrice(tier.type).yearly / 12).toFixed(2)}/month
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {tier.type === 'free' && (
                      <Typography variant="body1" color="text.secondary">
                        Perfect for getting started
                      </Typography>
                    )}
                  </Box>

                  {/* Features */}
                  <List sx={{ flex: 1, mb: 4, px: 0 }}>
                    {tier.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CheckIcon 
                            sx={{ 
                              color: '#4ade80',
                              fontSize: 20,
                            }} 
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{
                            color: 'white',
                            fontSize: '0.9rem',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {/* CTA Button */}
                  <Button
                    fullWidth
                    variant={tier.type === 'premium' && !isCurrentPlan ? 'contained' : 'outlined'}
                    size="large"
                    onClick={() => handleSelectPlan(tier.type)}
                    disabled={isButtonDisabled(tier.type)}
                    sx={{
                      height: 48,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      mt: 'auto',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                      ...(isCurrentPlan ? {
                        backgroundColor: 'rgba(107, 114, 128, 0.3)',
                        borderColor: 'rgba(107, 114, 128, 0.5)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'default',
                        '&:hover': {
                          backgroundColor: 'rgba(107, 114, 128, 0.3)',
                          borderColor: 'rgba(107, 114, 128, 0.5)',
                        },
                      } : tier.type === 'premium' ? {
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(139, 92, 246, 0.6)',
                        },
                        '&:active': {
                          transform: 'translateY(0) scale(0.98)',
                          boxShadow: '0 2px 10px rgba(139, 92, 246, 0.4)',
                        },
                      } : {
                        borderColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'rgba(255,255,255,0.4)',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        },
                        '&:active': {
                          transform: 'translateY(0) scale(0.98)',
                        },
                      }),
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transition: 'left 0.5s',
                      },
                      '&:hover::before': !isCurrentPlan ? {
                        left: '100%',
                      } : {},
                    }}
                  >
                    {getButtonText(tier.type)}
                  </Button>
                </Paper>
              </Box>
            );
          })}
        </Box>

        {/* FAQ Section */}
        <Box>
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            sx={{
              fontWeight: 700,
              color: 'white',
              mb: 6,
            }}
          >
            Frequently Asked Questions
          </Typography>

          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
            <Box flex={1}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  background: 'rgba(26, 26, 46, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 3,
                  height: '100%',
                }}
              >
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  What's the difference between plans?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Free users get 1,000 words per day with basic features. Pro users get 20,000 words per month with all features. Premium users get 50,000 words per month with unlimited processing. Platinum users get unlimited words per month.
                </Typography>
              </Paper>
            </Box>

            <Box flex={1}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  background: 'rgba(26, 26, 46, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 3,
                  height: '100%',
                }}
              >
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Can I change plans anytime?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
                </Typography>
              </Paper>
            </Box>

            <Box flex={1}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  background: 'rgba(26, 26, 46, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 3,
                  height: '100%',
                }}
              >
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Is there a free trial?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our Free plan is already a trial! You get 1,500 words per day to test all features. No credit card required to get started.
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Pricing;
