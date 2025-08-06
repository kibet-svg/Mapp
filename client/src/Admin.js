import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Alert,
  Container,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  Login,
  Dashboard,
  Message,
  Person,
  Email,
  Schedule,
  Refresh
} from '@mui/icons-material';

export default function Admin() {
  const [login, setLogin] = useState({ username: '', password: '' });
  const [loggedIn, setLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setLogin({ ...login, [e.target.name]: e.target.value });

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login)
      });

      if (res.ok) {
        setLoggedIn(true);
        fetchMessages();
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      fetchMessages();
    }
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <Container maxWidth="sm">
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Sign in to access the admin panel
          </Typography>
        </Box>

        <Card sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleLogin}>
            <TextField
              name="username"
              label="Username"
              value={login.username}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              name="password"
              type="password"
              label="Password"
              value={login.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <Box textAlign="center" mt={3}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<Login />}
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>
          </form>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your course marketplace
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchMessages}
        >
          Refresh Messages
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <Message sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" component="h2">
              Messages & Feedback ({messages.length})
            </Typography>
          </Box>

          {messages.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Messages from users will appear here
              </Typography>
            </Box>
          ) : (
            <List>
              {messages.map((msg, index) => (
                <React.Fragment key={msg.id}>
                  <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Person sx={{ color: 'text.secondary' }} />
                          <Typography variant="subtitle1" component="span" fontWeight="bold">
                            {msg.name || 'Anonymous'}
                          </Typography>
                          {msg.email && (
                            <>
                              <Email sx={{ color: 'text.secondary', ml: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                {msg.email}
                              </Typography>
                            </>
                          )}
                          <Chip
                            icon={<Schedule />}
                            label={new Date(msg.created_at).toLocaleDateString()}
                            size="small"
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {msg.message}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < messages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}