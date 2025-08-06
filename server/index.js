const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// SQLite DB setup
const db = new sqlite3.Database('./marketplace.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
    // Create tables if not exist
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image TEXT
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )`);
      // Insert default admin if not exists
      db.get('SELECT * FROM admin WHERE username = ?', ['admin'], (err, row) => {
        if (!row) {
          db.run('INSERT INTO admin (username, password) VALUES (?, ?)', ['admin', 'admin123']);
        }
      });
    });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('API is running');
});

// Get all courses
app.get('/api/courses', (req, res) => {
  db.all('SELECT * FROM courses', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new course
app.post('/api/courses', (req, res) => {
  const { title, description, price, image } = req.body;
  db.run('INSERT INTO courses (title, description, price, image) VALUES (?, ?, ?, ?)',
    [title, description, price, image],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Send a message/feedback
app.post('/api/messages', (req, res) => {
  const { name, email, message } = req.body;
  db.run('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
    [name, email, message],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Get all messages (admin)
app.get('/api/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin login (dummy, no hashing)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, adminId: row.id });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});