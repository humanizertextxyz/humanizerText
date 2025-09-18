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

const TermsOfService: React.FC = () => {
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
            Terms of Service
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, color: '#B0B0B0' }}>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>

          <Box sx={{ color: 'white' }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              By accessing and using HumanizerText ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              2. Description of Service
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              HumanizerText is a text processing tool that uses artificial intelligence to transform AI-generated content into more human-like text. The service includes:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Text humanization and rewriting services"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• AI detection and analysis tools"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• User account management and subscription services"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              3. User Responsibilities and Prohibited Uses
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              You agree to use the Service responsibly and in accordance with all applicable laws and regulations. You are prohibited from:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Using the Service for any illegal, harmful, or unauthorized purpose"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Attempting to gain unauthorized access to any part of the Service"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Using the Service to generate content that violates intellectual property rights"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Creating content that is defamatory, harassing, or harmful to others"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Using the Service to generate spam, malware, or malicious content"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              4. Disclaimer of Warranties and Limitation of Liability
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              <strong>IMPORTANT DISCLAIMER:</strong> HumanizerText is provided as a tool for text processing only. We are not liable for any consequences arising from your use of the Service.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              <strong>NO WARRANTIES:</strong> The Service is provided "as is" without any warranties, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that the results will meet your expectations.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              <strong>LIMITATION OF LIABILITY:</strong> To the maximum extent permitted by law, HumanizerText, its officers, directors, employees, and agents shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Loss of profits, data, or business opportunities"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Any damages resulting from the use or inability to use the Service"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Any content generated or processed through the Service"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Any third-party claims or actions arising from your use of the Service"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              5. Responsible Use Guidelines
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              <strong>USE WITH CARE:</strong> You acknowledge that the Service is a tool and that you are solely responsible for:
            </Typography>
            <List sx={{ pl: 2 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Ensuring all content generated complies with applicable laws and regulations"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Verifying the accuracy and appropriateness of all processed content"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Using the Service ethically and responsibly"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText 
                  primary="• Not encouraging or facilitating any harmful, illegal, or unethical activities"
                  sx={{ '& .MuiListItemText-primary': { color: '#E0E0E0', fontSize: '0.95rem' } }}
                />
              </ListItem>
            </List>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              6. Intellectual Property Rights
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              You retain ownership of any content you submit to the Service. By using the Service, you grant us a limited license to process your content solely for the purpose of providing the Service. We do not claim ownership of your content.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              7. Subscription and Payment Terms
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              Subscription fees are charged in advance and are non-refundable except as required by law. We reserve the right to change pricing with 30 days' notice. You may cancel your subscription at any time through your account settings.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              8. Termination
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We reserve the right to terminate or suspend your account at any time for violation of these terms or for any other reason at our sole discretion. Upon termination, your right to use the Service ceases immediately.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              9. Changes to Terms
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the new terms.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              10. Governing Law
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which HumanizerText operates, without regard to conflict of law principles.
            </Typography>

            <Typography variant="h5" sx={{ color: 'white', mb: 2, mt: 3 }}>
              11. Contact Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#E0E0E0' }}>
              If you have any questions about these Terms of Service, please contact us at support@humanizertext.com
            </Typography>

            <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Typography variant="body2" sx={{ color: '#B0B0B0', fontStyle: 'italic' }}>
              By using HumanizerText, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TermsOfService;
