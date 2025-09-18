import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  ContentCopy as ContentCopyIcon,
  AccessTime as AccessTimeIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeEmailForDocId } from '../utils/emailUtils';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase/config';

interface HistoryItem {
  id: string;
  originalText: string;
  humanizedText: string;
  timestamp: any;
  wordCount?: number;
  writingStyle: string;
  textLength: string;
  customInstructions?: string;
}

// Using centralized sanitizeEmailForDocId from utils

const History: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setLoading(false);
      return;
    }

    const sanitizedEmail = sanitizeEmailForDocId(currentUser.email);
    
    // Query user's history subcollection
    const q = query(
      collection(db, 'users', sanitizedEmail, 'history'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Skip deleted items
        if (data.deleted === true) {
          return;
        }
        items.push({
          id: doc.id,
          originalText: data.originalText,
          humanizedText: data.humanizedText,
          timestamp: data.timestamp,
          wordCount: data.wordCount,
          writingStyle: data.writingStyle,
          textLength: data.textLength,
          customInstructions: data.customInstructions,
        });
      });
      setHistoryItems(items);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleViewDetails = (item: HistoryItem) => {
    console.log('handleViewDetails called for item:', item.id);
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!currentUser || !currentUser.email) return;
    
    try {
      const sanitizedEmail = sanitizeEmailForDocId(currentUser.email);
      // Soft delete: mark as deleted instead of actually deleting
      await updateDoc(doc(db, 'users', sanitizedEmail, 'history', itemId), {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      console.log('Item marked as deleted:', itemId);
    } catch (error) {
      console.error('Error marking item as deleted:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown time';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!currentUser) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 0 },
      }}>
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', md: '3.5rem' },
                background: 'linear-gradient(45deg, #ffffff 30%, #fbbf24 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                mb: 3,
              }}
            >
              History
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                fontWeight: 400,
                opacity: 0.8,
                maxWidth: 600,
                mx: 'auto',
                mb: 6,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
              }}
            >
              View and manage your humanization history
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                background: 'rgba(26, 26, 46, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                maxWidth: 500,
                mx: 'auto',
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', mb: 3, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                Login or Sign Up to View Your History
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                Create an account to save and manage your humanization history. Track your usage, view past results, and access your content anytime.
              </Typography>
              
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    height: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 4,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Login
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => navigate('/signup')}
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 4,
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  Sign Up
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      py: { xs: 4, md: 8 },
      px: { xs: 2, md: 0 },
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box mb={{ xs: 4, md: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3.5rem' },
              background: 'linear-gradient(45deg, #ffffff 30%, #fbbf24 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              mb: 2,
            }}
          >
            History
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              fontWeight: 400,
              opacity: 0.8,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
            }}
          >
            View and manage your humanization history
          </Typography>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Box textAlign="center" py={8}>
            <CircularProgress sx={{ color: '#6366f1', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading your history...
            </Typography>
          </Box>
        ) : historyItems.length === 0 ? (
          /* Empty State */
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
            }}
          >
            <HistoryIcon sx={{ fontSize: 64, color: '#6366f1', mb: 3 }} />
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontSize: { xs: '1.3rem', md: '1.5rem' } }}>
              No History Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: { xs: '0.9rem', md: '1rem' } }}>
              Start humanizing text to see your history here. Your past humanizations will be saved and displayed in this section.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                height: 48,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                px: 4,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Start Humanizing
            </Button>
          </Paper>
        ) : (
          /* History Items */
          <Box display="flex" flexDirection="column" gap={3}>
            {historyItems.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                onClick={(e) => {
                  console.log('Paper clicked for item:', item.id);
                  e.preventDefault();
                  handleViewDetails(item);
                }}
                sx={{
                  p: { xs: 2, md: 3 },
                  background: 'rgba(26, 26, 46, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                  },
                }}
              >
                <Box display="flex" alignItems="flex-start" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
                  {/* Date and Time */}
                  <Box display="flex" alignItems="center" gap={1} minWidth={{ xs: '100%', md: 200 }} flexDirection={{ xs: 'row', md: 'column' }} textAlign={{ xs: 'left', md: 'left' }}>
                    <AccessTimeIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                        {formatDate(item.timestamp)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' } }}>
                        {formatTime(item.timestamp)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Text Preview */}
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body1" sx={{ color: 'white', mb: 2, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                      {truncateText(item.originalText)}
                    </Typography>
                    
                    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                      <Chip
                        label={`${item.wordCount} words`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          color: '#6366f1',
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', md: '0.8rem' },
                        }}
                      />
                      <Chip
                        label={item.writingStyle}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(251, 191, 36, 0.2)',
                          color: '#fbbf24',
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', md: '0.8rem' },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box display="flex" gap={1} flexDirection={{ xs: 'row', md: 'column' }} alignItems={{ xs: 'center', md: 'flex-start' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(item);
                      }}
                      sx={{
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        color: '#6366f1',
                        textTransform: 'none',
                        fontSize: { xs: '0.7rem', md: '0.8rem' },
                        '&:hover': {
                          borderColor: '#6366f1',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        },
                      }}
                    >
                      View Details
                    </Button>
                    
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      sx={{
                        color: '#ef4444',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* Details Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 3,
              m: { xs: 2, md: 4 },
            }
          }}
        >
          <DialogTitle sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
            Humanization Details
          </DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Box>
                <Box mb={3}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: { xs: '1rem', md: '1.2rem' } }}>
                    Original Text
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                      {selectedItem.originalText}
                    </Typography>
                    <Box mt={2} display="flex" justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(selectedItem.originalText)}
                        sx={{ color: '#6366f1' }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                </Box>

                <Box mb={3}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: { xs: '1rem', md: '1.2rem' } }}>
                    Humanized Text
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                      {selectedItem.humanizedText}
                    </Typography>
                    <Box mt={2} display="flex" justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(selectedItem.humanizedText)}
                        sx={{ color: '#6366f1' }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip
                    label={`${selectedItem.wordCount} words`}
                    sx={{
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#6366f1',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                    }}
                  />
                  <Chip
                    label={`Style: ${selectedItem.writingStyle}`}
                    sx={{
                      backgroundColor: 'rgba(251, 191, 36, 0.2)',
                      color: '#fbbf24',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                    }}
                  />
                  <Chip
                    label={`Length: ${selectedItem.textLength}`}
                    sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      color: '#4ade80',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                    }}
                  />
                </Box>

                {selectedItem.customInstructions && (
                  <Box mt={3}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: { xs: '1rem', md: '1.2rem' } }}>
                      Custom Instructions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                      {selectedItem.customInstructions}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenDialog(false)}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default History;
