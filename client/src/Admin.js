import React, { useState } from 'react';
import { TextField, Button, Typography, Box, List, ListItem, ListItemText, Paper, Alert } from '@mui/material';

export default function Admin() {
  const [login, setLogin] = useState({ username: '', password: '' });
  const [loggedIn, setLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  const handleChange = e => setLogin({ ...login, [e.target.name]: e.target.value });
  const handleLogin = async e => {
    e.preventDefault();
    setError('');
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
  };
  const fetchMessages = async () => {
    const res = await fetch('/api/messages');
    const data = await res.json();
    setMessages(data);
  };
  if (!loggedIn) {
    return (
      <Box maxWidth={400} mx="auto">
        <Typography variant="h4" gutterBottom>Admin Login</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleLogin}>
          <TextField
            name="username"
            label="Username"
            value={login.username}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="password"
            type="password"
            label="Password"
            value={login.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>Login</Button>
        </form>
      </Box>
    );
  }
  return (
    <Box maxWidth={700} mx="auto">
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography variant="h6" gutterBottom>Messages/Feedback</Typography>
      <Paper>
        <List>
          {messages.map(msg => (
            <ListItem key={msg.id} alignItems="flex-start" divider>
              <ListItemText
                primary={<>
                  <b>{msg.name || 'Anonymous'}</b> ({msg.email || 'No email'})
                  <Typography variant="caption" sx={{ ml: 1 }}>{msg.created_at}</Typography>
                </>}
                secondary={msg.message}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}