import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Channel from './pages/Channel';
import Studio from './pages/Studio';
import Auth from './pages/Auth';
import { useAuth } from './context/AuthContext';
import './index.css';

function App() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="app-container">
      {/* Navbar - Video Platform Top Bar */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--twitch-purple)" xmlns="http://www.w3.org/2000/svg">
            {/* Elegant V logo replacing Twitch */}
            <path d="M4.5 3L12 21L19.5 3H15.5L12 13L8.5 3H4.5Z" />
          </svg>
          <span className="brand-text">VidTube</span>
        </div>
        <div className="nav-center">
          <Link to="/" className="nav-link active">Browse</Link>
        </div>
        <div className="nav-search">
          <input type="text" className="input-field" placeholder="Search" />
          <button className="search-btn">🔍</button>
        </div>
        <div className="nav-right">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="btn-secondary" onClick={() => navigate('/studio', { state: { activeTab: 'Content' } })} style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>
                Upload Video
              </button>
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`} 
                alt="Avatar" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}
                onClick={() => navigate('/studio')}
                title="Go to Studio"
              />
              <button className="btn-secondary" onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </div>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => navigate('/auth')}>Log In</button>
              <button className="btn-primary" onClick={() => navigate('/auth')}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/channel/:channelId" element={<Channel />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </div>
  );
}

export default App;
