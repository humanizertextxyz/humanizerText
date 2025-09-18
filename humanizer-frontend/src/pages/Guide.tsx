import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoFixHigh,
  Settings,
  Psychology,
  Speed,
  Security,
  TrendingUp,
  Help,
  Info,
} from '@mui/icons-material';

const Guide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarTop, setSidebarTop] = useState(20);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const sidebarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: <Help /> },
    { id: 'basic-settings', title: 'Basic Settings', icon: <Settings /> },
    { id: 'advanced-settings', title: 'Advanced Settings', icon: <Psychology /> },
    { id: 'ai-parameters', title: 'AI Engine Parameters', icon: <Speed /> },
    { id: 'tips-tricks', title: 'Tips & Tricks', icon: <Info /> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      // Handle sidebar positioning
      if (sidebarRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const sidebarHeight = sidebarRef.current.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Calculate if sidebar should stick to top or follow scroll
        if (containerRect.top <= 20) {
          // Sidebar should stick to top
          setSidebarTop(20);
        } else {
          // Sidebar should follow the container, but start lower
          setSidebarTop(Math.max(80, containerRect.top + 20));
        }
        
        // Prevent sidebar from going below viewport
        const maxTop = viewportHeight - sidebarHeight - 20;
        if (sidebarTop > maxTop) {
          setSidebarTop(Math.max(20, maxTop));
        }
      }
      
      // Handle active section highlighting
      for (const section of sections) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sidebarTop]);

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      py: 4,
    }}>
      <Container maxWidth="lg">
        <Box 
          ref={containerRef}
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '300px 1fr' },
            gap: 4,
            minHeight: '100vh',
            position: 'relative'
          }}>
          {/* Sidebar Placeholder */}
          <Box sx={{ 
            width: { xs: '100%', md: '300px' },
            display: { xs: 'none', md: 'block' }
          }}>
            {/* Fixed Sidebar */}
            <Box 
              ref={sidebarRef}
              sx={{ 
                position: 'fixed', 
                top: `${sidebarTop}px`,
                left: 'calc(50% - 600px)',
                width: '300px',
                zIndex: 1000,
                maxHeight: 'calc(100vh - 40px)',
                overflowY: 'auto'
              }}>
            <Paper sx={{ 
              p: 2, 
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}>
              <Typography variant="h6" sx={{ 
                color: 'white', 
                mb: 2, 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Contents
              </Typography>
              <List>
                {sections.map((section, index) => (
                  <ListItem key={section.id} disablePadding>
                    <ListItemButton
                      onClick={() => scrollToSection(section.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: activeSection === section.id ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                        '&:hover': {
                          bgcolor: activeSection === section.id ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {section.icon}
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              {index + 1}. {section.title}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
            </Box>
          </Box>

          {/* Mobile Sidebar Toggle */}
          <Box sx={{ 
            display: { xs: 'block', md: 'none' },
            mb: 2,
            textAlign: 'center'
          }}>
            <Button
              variant="outlined"
              onClick={() => setActiveSection(activeSection === 'mobile-menu' ? 'getting-started' : 'mobile-menu')}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              📋 Guide Contents
            </Button>
          </Box>

          {/* Mobile Sidebar */}
          {activeSection === 'mobile-menu' && (
            <Box sx={{ 
              display: { xs: 'block', md: 'none' },
              mb: 3
            }}>
              <Paper sx={{ 
                p: 2, 
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
              }}>
                <Typography variant="h6" sx={{ 
                  color: 'white', 
                  mb: 2, 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Contents
                </Typography>
                <List>
                  {sections.map((section, index) => (
                    <ListItem key={section.id} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          scrollToSection(section.id);
                          setActiveSection(section.id);
                        }}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          backgroundColor: activeSection === section.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {section.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              {index + 1}. {section.title}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {/* Main Content */}
          <Box sx={{ 
            minWidth: 0,
            paddingLeft: { xs: 0, md: 0 }
          }}>
            <Box sx={{ color: 'white' }}>
              {/* Getting Started */}
              <Box ref={(el) => { sectionRefs.current['getting-started'] = el as HTMLDivElement; }} sx={{ mb: 6 }}>
                <Typography variant="h4" sx={{ 
                  mb: 3,
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  1. Getting Started
                </Typography>

                <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                      Quick Start Guide
                    </Typography>
                    <Box component="ol" sx={{ color: 'rgba(255, 255, 255, 0.8)', pl: 2 }}>
                      <li>Paste your AI-generated text into the input box</li>
                      <li>Choose your writing style (Professional, Creative, Casual, or Academic)</li>
                      <li>Select your desired text length (Maintain, Shorter, or Longer)</li>
                      <li>Click "Humanize Text" to process your content</li>
                      <li>Copy the humanized result and use it confidently</li>
                    </Box>
                  </CardContent>
                </Card>
              </Box>


              {/* Basic Settings */}
              <Box ref={(el) => { sectionRefs.current['basic-settings'] = el as HTMLDivElement; }} sx={{ mb: 6 }}>
                <Typography variant="h4" sx={{ 
                  mb: 3,
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  2. Basic Settings
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          💼 Writing Style
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Chip label="Professional" size="small" sx={{ mr: 1, mb: 1, bgcolor: 'rgba(102, 126, 234, 0.2)', color: 'white' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Formal, business-appropriate tone with clear structure
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Chip label="Creative" size="small" sx={{ mr: 1, mb: 1, bgcolor: 'rgba(102, 126, 234, 0.2)', color: 'white' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Artistic, expressive language with creative flair
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Chip label="Casual" size="small" sx={{ mr: 1, mb: 1, bgcolor: 'rgba(102, 126, 234, 0.2)', color: 'white' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Conversational, relaxed tone for everyday communication
                          </Typography>
                        </Box>
                        <Box>
                          <Chip label="Academic" size="small" sx={{ mr: 1, mb: 1, bgcolor: 'rgba(102, 126, 234, 0.2)', color: 'white' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Scholarly, research-oriented with formal academic language
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box>
                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          📏 Text Length
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Chip label="⚖️ Maintain" size="small" sx={{ mr: 1, mb: 1, bgcolor: 'rgba(102, 126, 234, 0.2)', color: 'white' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Keep the same length as your original text (±10%)
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Chip label="📉 Shorter" size="small" sx={{ mr: 1, mb: 1, bgcolor: 'rgba(102, 126, 234, 0.2)', color: 'white' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Reduce text length by more than 15% for conciseness
                          </Typography>
                        </Box>
                        <Box>
                          <Chip label="📈 Longer" size="small" sx={{ mr: 1, mb: 1, bgcolor: 'rgba(102, 126, 234, 0.2)', color: 'white' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Expand text length by more than 15% for detail
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Box>

              {/* Advanced Settings */}
              <Box ref={(el) => { sectionRefs.current['advanced-settings'] = el as HTMLDivElement; }} sx={{ mb: 6 }}>
                <Typography variant="h4" sx={{ 
                  mb: 3,
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  3. Advanced Settings
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🔑 Keywords to Preserve
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Specify important words, phrases, or terms that must remain unchanged in your text.
                        </Typography>
                        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'rgba(33, 150, 243, 0.9)' }}>
                          <strong>Example:</strong> "API, JavaScript, React" - These terms will stay exactly as written.
                        </Alert>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🎯 Reading Level Target
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Set the complexity level for your target audience's reading comprehension.
                        </Typography>
                        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'rgba(33, 150, 243, 0.9)' }}>
                          <strong>Example:</strong> "College Level, Grade 9-10" - Adjusts vocabulary and sentence complexity.
                        </Alert>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🎭 Persona Lens
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Define the perspective or voice you want the text to adopt.
                        </Typography>
                        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'rgba(33, 150, 243, 0.9)' }}>
                          <strong>Example:</strong> "teacher explaining to students" - Adjusts explanation style and complexity.
                        </Alert>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box>
                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🛡️ Tone Guardrails
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Set boundaries for the emotional tone and attitude of your text.
                        </Typography>
                        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'rgba(33, 150, 243, 0.9)' }}>
                          <strong>Example:</strong> "curious but not snarky" - Maintains inquisitive tone without sarcasm.
                        </Alert>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🚫 Additional Prohibited Items
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Specify additional words, phrases, or elements to avoid in your text.
                        </Typography>
                        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'rgba(33, 150, 243, 0.9)' }}>
                          <strong>Example:</strong> "corporate buzzwords" - Avoids terms like "synergy" or "leverage."
                        </Alert>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          ✏️ Custom Request
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Add any specific instructions or requirements for your text transformation.
                        </Typography>
                        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'rgba(33, 150, 243, 0.9)' }}>
                          <strong>Example:</strong> "Use more active voice" or "Include more examples."
                        </Alert>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Box>

              {/* AI Engine Parameters */}
              <Box ref={(el) => { sectionRefs.current['ai-parameters'] = el as HTMLDivElement; }} sx={{ mb: 6 }}>
                <Typography variant="h4" sx={{ 
                  mb: 3,
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  4. AI Engine Parameters
                </Typography>
                
                <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(255, 193, 7, 0.1)', color: 'rgba(255, 193, 7, 0.9)' }}>
                  <strong>Advanced Users Only:</strong> Adjusting these parameters affects both AI detection bypass and text variation
                </Alert>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🔥 temperature
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Controls how creative and varied the AI's word choices are. Higher values = more creative but potentially less coherent.
                        </Typography>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                            Default: 0.95
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          📊 top_p
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Controls the diversity of word choices. Lower values focus on more likely words, higher values consider more options.
                        </Typography>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                            Default: 1.0
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box>
                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🔄 frequency_penalty
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Prevents the AI from repeating the same words or phrases too often. Higher values = less repetition.
                        </Typography>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                            Default: 0.6
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🌟 presence_penalty
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                          Encourages the AI to introduce new topics or concepts. Higher values = more topic diversity.
                        </Typography>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                            Default: 0.1
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>

              </Box>


              {/* Tips & Tricks */}
              <Box ref={(el) => { sectionRefs.current['tips-tricks'] = el as HTMLDivElement; }} sx={{ mb: 6 }}>
                <Typography variant="h4" sx={{ 
                  mb: 3,
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  5. Tips & Tricks
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          💡 Best Practices
                        </Typography>
                        <Box component="ul" sx={{ color: 'rgba(255, 255, 255, 0.8)', pl: 2 }}>
                          <li>Start with basic settings and gradually add advanced options</li>
                          <li>Use "Keywords to Preserve" for technical terms, names, and important phrases</li>
                          <li>Set appropriate reading level for your target audience</li>
                          <li>Use tone guardrails to maintain consistent voice</li>
                          <li>Test different AI parameter combinations for optimal results</li>
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          ⚠️ Common Mistakes
                        </Typography>
                        <Box component="ul" sx={{ color: 'rgba(255, 255, 255, 0.8)', pl: 2 }}>
                          <li>Setting AI parameters too high (can make text incoherent)</li>
                          <li>Not preserving important keywords or technical terms</li>
                          <li>Using inappropriate tone for the content type</li>
                          <li>Ignoring reading level for your audience</li>
                          <li>Not testing different settings combinations</li>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box>
                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🎯 Use Case Examples
                        </Typography>
                        <Accordion sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                            <Typography sx={{ color: 'white' }}>Academic Papers</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Use Academic style, maintain length, preserve citations and technical terms in Keywords to Preserve.
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                        <Accordion sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                            <Typography sx={{ color: 'white' }}>Marketing Content</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Use Creative style, add brand names to Keywords to Preserve, set tone guardrails for brand voice.
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                        <Accordion sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                            <Typography sx={{ color: 'white' }}>Business Reports</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              Use Professional style, maintain length, preserve data points and company names.
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                          🔧 Troubleshooting
                        </Typography>
                        <Box component="ul" sx={{ color: 'rgba(255, 255, 255, 0.8)', pl: 2 }}>
                          <li>If text seems incoherent, lower the Creativity (Temperature) setting</li>
                          <li>If too repetitive, increase the Reduce Repeats (Frequency Penalty)</li>
                          <li>If meaning is lost, add important concepts to Keywords to Preserve</li>
                          <li>If tone is wrong, adjust Tone Guardrails or Persona Lens</li>
                          <li>Reset to defaults if settings become too complex</li>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Guide;
