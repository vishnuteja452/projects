import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import videosData from '../data/videos.json';

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Home');
  const navigate = useNavigate();

  const filteredVideos = useMemo(() => {
    if (activeTab === 'Trending') {
      return [...videosData].sort((a, b) => parseInt(b.views) - parseInt(a.views)).slice(0, 10);
    }
    if (activeTab === 'Subscriptions') {
      if (localStorage.getItem('isLoggedIn') === 'true') {
        const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
        return videosData.filter(v => subs.includes(v.owner.fullname));
      } else {
        return null; // Signals not logged in
      }
    }
    if (activeTab === 'Library' || activeTab === 'Liked Videos') {
      return videosData.slice(20, 25);
    }
    if (activeTab === 'History') {
      if (localStorage.getItem('isLoggedIn') === 'true') {
        const history = localStorage.getItem('watchHistory');
        return history ? JSON.parse(history) : [];
      } else {
        return null; // Signals not logged in
      }
    }
    return videosData;
  }, [activeTab]);

  const navItems = [
    { label: 'Home', icon: '🏠' },
    { label: 'Trending', icon: '🔥' },
    { label: 'Subscriptions', icon: '📺' }
  ];

  const libraryItems = [
    { label: 'Library', icon: '📚' },
    { label: 'History', icon: '🕒' },
    { label: 'Liked Videos', icon: '👍' }
  ];

  // Helper to extract YouTube ID from thumbnail
  const extractVideoId = (thumbnailUrl) => {
    try {
      return thumbnailUrl.split('/vi/')[1].split('/')[0];
    } catch {
      return null;
    }
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">For You</div>
        {navItems.map(item => (
          <div 
            key={item.label}
            className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
            onClick={() => setActiveTab(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}

        <hr className="divider" />
        <div className="sidebar-header">Your Library</div>
        
        {libraryItems.map(item => (
          <div 
            key={item.label}
            className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
            onClick={() => setActiveTab(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
        
        {user && (
          <>
            <hr className="divider" />
            <div className="sidebar-header">Your Channel</div>
            <div className="nav-item" onClick={() => navigate('/studio')}>
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`} alt="Avatar" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
              <span className="nav-label" style={{ marginLeft: '12px' }}>Creator Studio</span>
            </div>
            <div className="nav-item" onClick={() => navigate(`/channel/${encodeURIComponent(user.username)}`)}>
              <span className="nav-icon">👤</span>
              <span className="nav-label">View Channel</span>
            </div>
          </>
        )}

        <hr className="divider" />
        <div className="sidebar-header">Recommended Channels</div>
        
        <div className="channel-item" onClick={() => navigate('/channel/LTT')}>
          <img src="https://ui-avatars.com/api/?name=Linus+Tech+Tips&background=random" alt="LTT" className="channel-avatar" />
          <div className="channel-details">
            <div className="channel-name">Linus Tech Tips</div>
            <div className="channel-category">Tech</div>
          </div>
          <div className="channel-live">🔴 45K</div>
        </div>
        <div className="channel-item" onClick={() => navigate('/channel/MKBHD')}>
          <img src="https://ui-avatars.com/api/?name=MKBHD&background=random" alt="MKBHD" className="channel-avatar" />
          <div className="channel-details">
            <div className="channel-name">Marques Brownlee</div>
            <div className="channel-category">Hardware</div>
          </div>
          <div className="channel-live">🔴 20K</div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="content-area">
        <h2 className="section-title">
          {activeTab} <span className="text-muted">videos</span>
        </h2>
        
        {filteredVideos === null && (activeTab === 'History' || activeTab === 'Subscriptions') ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>
              {activeTab === 'History' ? 'Keep track of what you watch' : 'Don\'t miss new videos'}
            </h3>
            <p style={{ marginBottom: '24px' }}>
              {activeTab === 'History' ? 'Watch history isn\'t viewable when signed out.' : 'Sign in to see updates from your favorite YouTube channels.'}
            </p>
            <button className="btn-primary" onClick={() => navigate('/auth')}>Sign In</button>
          </div>
        ) : filteredVideos.length === 0 && (activeTab === 'History' || activeTab === 'Subscriptions') ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            <p>
              {activeTab === 'History' ? 'You haven\'t watched any videos yet.' : 'You haven\'t subscribed to any channels yet.'}
            </p>
          </div>
        ) : (
          <div className="video-grid">
            {filteredVideos.map((video, index) => {
              const ytId = extractVideoId(video.thumbnail);
              return (
                <div 
                  key={index} 
                  className="video-card animate-fade-in" 
                  style={{animationDelay: `${index * 0.05}s`}}
                  onClick={() => navigate(`/watch/${ytId}`, { state: { video } })}
                >
                  <div className="video-thumbnail-container">
                    <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                    <span className="video-live-badge">LIVE</span>
                    <span className="video-duration">{video.views} viewers</span>
                  </div>
                  <div className="video-info">
                    <img src={video.owner.avatar} alt={video.owner.fullname} className="video-avatar" />
                    <div className="video-details">
                      <h3 className="video-title" title={video.title}>{video.title}</h3>
                      <div className="video-meta">{video.owner.fullname}</div>
                      <div className="video-category">Science & Technology</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
