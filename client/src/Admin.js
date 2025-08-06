import React, { useState } from 'react';

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
      <div>
        <h2>Admin Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input name="username" placeholder="Username" value={login.username} onChange={handleChange} /><br />
          <input name="password" type="password" placeholder="Password" value={login.password} onChange={handleChange} /><br />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <h3>Messages/Feedback</h3>
      <ul>
        {messages.map(msg => (
          <li key={msg.id}>
            <b>{msg.name || 'Anonymous'}</b> ({msg.email || 'No email'})<br />
            <i>{msg.created_at}</i><br />
            {msg.message}
          </li>
        ))}
      </ul>
    </div>
  );
}