import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  Upgrade as UpgradeIcon,
  Star as StarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionTier, formatWordsLimit } from '../utils/subscription';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentTier: string;
  reason: string;
  limit?: number;
  wordsAttempted?: number;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  currentTier,
  reason,
  limit,
  wordsAttempted
}) => {
  const navigate = useNavigate();
  const tier = getSubscriptionTier(currentTier);

  const getTitle = () => {
    switch (reason) {
      case 'daily_limit_reached':
      case 'daily_limit_exceeded':
        return '📊 Daily Limit Reached';
      case 'monthly_limit_reached':
      case 'monthly_limit_exceeded':
        return '📈 Monthly Limit Reached';
      case 'per_process_limit':
        return '📝 Text Too Long';
      default:
        return '🚀 Upgrade Your Plan';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'daily_limit_reached':
        return `You've used all ${formatWordsLimit(limit || 0)} words for today.`;
      case 'daily_limit_exceeded':
        return `This request would exceed your daily limit of ${formatWordsLimit(limit || 0)} words.`;
      case 'monthly_limit_reached':
        return `You've used all ${formatWordsLimit(limit || 0)} words for this month.`;
      case 'monthly_limit_exceeded':
        return `This request would exceed your monthly limit of ${formatWordsLimit(limit || 0)} words.`;
      case 'per_process_limit':
        return `Your text has ${wordsAttempted} words, but your plan allows only ${formatWordsLimit(limit || 0)} words per request.`;
      default:
        return 'Upgrade to continue using our humanization service.';
    }
  };

  const getRecommendedPlan = () => {
    if (tier.type === 'free') return 'pro';
    if (tier.type === 'pro') return 'premium';
    if (tier.type === 'premium') return 'platinum';
    return 'platinum';
  };

  const recommendedTier = getSubscriptionTier(getRecommendedPlan());

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
            {getTitle()}
          </Typography>
          <Button
            onClick={onClose}
            sx={{ minWidth: 'auto', p: 1, color: 'rgba(255,255,255,0.7)' }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box mb={3}>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.6 }}>
            {getMessage()}
          </Typography>
          
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Upgrade to a higher plan to get more words and unlock advanced features.
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

        {/* Current Plan */}
        <Box mb={3}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Current Plan: {tier.name}
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {tier.type === 'free' && (
              <Chip
                label={`${formatWordsLimit(tier.dailyWords)} words/day`}
                size="small"
                sx={{ backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af' }}
              />
            )}
            {tier.type !== 'free' && (
              <Chip
                label={`${formatWordsLimit(tier.monthlyWords)} words/month`}
                size="small"
                sx={{ backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af' }}
              />
            )}
            <Chip
              label={tier.wordsPerProcess > 0 ? `${formatWordsLimit(tier.wordsPerProcess)} words/process` : 'Unlimited words/process'}
              size="small"
              sx={{ backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af' }}
            />
          </Box>
        </Box>

        {/* Recommended Plan */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: 2,
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <StarIcon sx={{ color: '#fbbf24' }} />
            <Typography variant="h6" sx={{ color: 'white' }}>
              Recommended: {recommendedTier.name}
            </Typography>
            <Chip
              label="Best Value"
              size="small"
              sx={{
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                color: '#fbbf24',
                fontWeight: 600
              }}
            />
          </Box>
          
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {recommendedTier.type !== 'free' && (
              <Chip
                label={`${formatWordsLimit(recommendedTier.monthlyWords)} words/month`}
                size="small"
                sx={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}
              />
            )}
            <Chip
              label={recommendedTier.wordsPerProcess > 0 ? `${formatWordsLimit(recommendedTier.wordsPerProcess)} words/process` : 'Unlimited words/process'}
              size="small"
              sx={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}
            />
          </Box>
          
          <Typography variant="h5" sx={{ color: '#4ade80', fontWeight: 700 }}>
            ${recommendedTier.price}/month
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpgrade}
          variant="contained"
          startIcon={<UpgradeIcon />}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textTransform: 'none',
            px: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            },
          }}
        >
          Upgrade Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeModal; 