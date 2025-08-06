import React, { useState } from 'react';
import { TextField, Button, Snackbar, Typography, Box } from '@mui/material';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setSent(true);
    setForm({ name: '', email: '', message: '' });
  };
  return (
    <Box maxWidth={500} mx="auto">
      <Typography variant="h4" gutterBottom>Contact / Feedback</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          name="name"
          label="Name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          name="email"
          label="Email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
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
          required
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>Send</Button>
      </form>
      <Snackbar
        open={sent}
        autoHideDuration={3000}
        onClose={() => setSent(false)}
        message="Thank you for your message!"
      />
    </Box>
  );
}