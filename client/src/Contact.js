import React, { useState } from 'react';
import {
  TextField,
  Button,
  Snackbar,
  Typography,
  Box,
  Paper,
  Container,
  Alert
} from '@mui/material';
import { Send, Email, Person, Message } from '@mui/icons-material';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!form.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom>
          Get in Touch
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Have questions or feedback? We'd love to hear from you!
        </Typography>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <TextField
            name="name"
            label="Name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
            InputProps={{
              startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <TextField
            name="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <TextField
            name="message"
            label="Message"
            value={form.message}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={4}
            error={!!errors.message}
            helperText={errors.message}
            InputProps={{
              startAdornment: <Message sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
            }}
          />
          <Box textAlign="center" mt={3}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<Send />}
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={sent}
        autoHideDuration={6000}
        onClose={() => setSent(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSent(false)} severity="success" sx={{ width: '100%' }}>
          Thank you for your message! We'll get back to you soon.
        </Alert>
      </Snackbar>
    </Container>
  );
}