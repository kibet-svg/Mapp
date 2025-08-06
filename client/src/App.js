import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Courses from './Courses';
import Contact from './Contact';
import Admin from './Admin';

function Home() {
  return <div><h2>Welcome to the YouTuber's Course Marketplace</h2></div>;
}
function Courses() {
  return <div><h2>Courses</h2></div>;
}
function Contact() {
  return <div><h2>Contact / Feedback</h2></div>;
}
function Admin() {
  return <div><h2>Admin Dashboard</h2></div>;
}

function App() {
  return (
    <Router>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
