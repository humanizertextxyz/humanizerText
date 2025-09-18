import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      py: 4,
    }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            color: 'white',
            mb: 3,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Back
        </Button>
        
        <Paper sx={{
          p: 4,
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 2,
        }}>
          <Typography variant="h3" sx={{ 
            color: 'white', 
            mb: 4,
            background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Privacy Policy
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, color: '#B0B0B0' }}>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>

          <Box sx={{ color: 'white' }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              1. Information We Collect
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
            </Typography>
            
            <Typography variant="h6" sx={{ color: 'white', mb: 1, mt: 2 }}>
              Personal Information:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Email address and display name"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Account creation date and subscription information"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Payment information (processed securely through Stripe)"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h6" sx={{ color: 'white', mb: 1, mt: 2 }}>
              Usage Information:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Text content you submit for processing (temporarily stored)"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Processing history and usage statistics"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Device information and IP address"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              2. How We Use Your Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We use the information we collect to:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Provide, maintain, and improve our services"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Process your text humanization requests"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Manage your account and subscription"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Send you important updates about our service"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Monitor usage limits and prevent abuse"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              3. Information Sharing and Disclosure
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• With your explicit consent"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• To comply with legal obligations or court orders"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• To protect our rights, property, or safety, or that of our users"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• With service providers who assist us in operating our platform (e.g., Firebase, Stripe)"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              4. Data Security
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We implement appropriate security measures to protect your personal information:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Encryption of data in transit and at rest"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Secure authentication and access controls"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Regular security audits and updates"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Limited access to personal information on a need-to-know basis"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              5. Data Retention
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Account information: Retained while your account is active"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Processing history: Retained for 30 days after processing"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Text content: Automatically deleted after processing (not stored permanently)"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              6. Your Rights and Choices
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              You have the following rights regarding your personal information:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Access: Request a copy of your personal information"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Correction: Update or correct your information"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Deletion: Request deletion of your account and data"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Portability: Export your data in a machine-readable format"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              7. Cookies and Tracking Technologies
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie settings through your browser preferences.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              8. Third-Party Services
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              Our service integrates with third-party providers:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Firebase (Google): Authentication, database, and hosting services"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Stripe: Payment processing (we do not store payment information)"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• OpenAI: AI processing services (content is processed but not stored by OpenAI)"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              9. International Data Transfers
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              10. Children's Privacy
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              11. Changes to This Privacy Policy
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We may update this privacy policy from time to time. We will notify you of any material changes by posting the new privacy policy on this page and updating the "Last updated" date. Your continued use of our service after such changes constitutes acceptance of the updated policy.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              12. Contact Us
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              Email: privacy@humanizertext.com<br />
              Support: support@humanizertext.com
            </Typography>

            <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Typography variant="body2" sx={{ color: '#B0B0B0', fontStyle: 'italic' }}>
              This Privacy Policy is effective as of the date listed above and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
