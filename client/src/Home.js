import React from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Container,
  Paper
} from '@mui/material';
import { School, VideoLibrary, Support } from '@mui/icons-material';

export default function Home() {
  return (
    <Box>
      {/* Hero Section */}
      <Paper 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          mb: 6,
          borderRadius: 3
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ fontWeight: 700 }}>
            Welcome to YouTuber Courses
          </Typography>
          <Typography variant="h5" align="center" sx={{ mb: 4, opacity: 0.9 }}>
            Learn from the best content creators and take your skills to the next level
          </Typography>
          <Box textAlign="center">
            <Button 
              variant="contained" 
              size="large" 
              sx={{ 
                backgroundColor: 'white', 
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'grey.100'
                }
              }}
            >
              Explore Courses
            </Button>
          </Box>
        </Container>
      </Paper>

      {/* Features Section */}
      <Container maxWidth="lg">
        <Typography variant="h3" component="h2" gutterBottom align="center" sx={{ mb: 6 }}>
          Why Choose Our Courses?
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <School sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Expert Instructors
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Learn from experienced YouTubers who have mastered their craft and built successful channels.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <VideoLibrary sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  High-Quality Content
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Access to premium video content, resources, and exclusive insights from top creators.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Support sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Community Support
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Join a community of learners and get support from both instructors and fellow students.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CTA Section */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ready to Start Learning?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Browse our course catalog and find the perfect course for your goals.
          </Typography>
          <Button variant="contained" size="large" href="/courses">
            View All Courses
          </Button>
        </Box>
      </Container>
    </Box>
  );
}