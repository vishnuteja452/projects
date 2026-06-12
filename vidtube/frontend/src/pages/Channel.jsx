import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import videosData from '../data/videos.json';

export default function Channel() {
  const { channelId } = useParams(); // channel name
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Videos');

  // Filter videos belonging to this channel
  const displayVideos = [];

  const extractVideoId = (thumbnailUrl) => {
    try {
      return thumbnailUrl.split('/vi/')[1].split('/')[0];
    } catch {
      return null;
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-dark)' }}>
      {/* Channel Header Banner */}
      <div style={{ width: '100%', height: '200px', background: 'linear-gradient(90deg, #9146FF 0%, #3ea6ff 100%)' }}></div>
      
      {/* Channel Info */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', transform: 'translateY(-40px)' }}>
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(channelId)}&background=random&size=128`} 
            style={{ width: '128px', height: '128px', borderRadius: '50%', border: '4px solid var(--bg-dark)' }} 
            alt={channelId} 
          />
          <div style={{ marginTop: '30px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{channelId}</h1>
            <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '4px' }}>
              <span>@{(channelId || "channel").replace(/\s/g, '').toLowerCase()}</span>
              <span>•</span>
              <span>1.5M subscribers</span>
              <span>•</span>
              <span>{displayVideos.length * 4} videos</span>
            </div>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome to my channel! We talk about tech, software, and hardware.</p>
            <button className="btn-primary" style={{ marginTop: '16px', borderRadius: '20px', padding: '8px 24px', background: '#fff', color: '#000' }}>Subscribe</button>
          </div>
        </div>

        {/* Channel Tabs */}
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-light)', marginTop: '-10px' }}>
          {['Home', 'Videos', 'Playlists', 'Community'].map(tab => (
            <div 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '12px 0', 
                cursor: 'pointer', 
                fontWeight: '500',
                color: activeTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '3px solid var(--text-main)' : '3px solid transparent'
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px 0' }}>
          {activeTab === 'Videos' || activeTab === 'Home' ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Click here to upload amazing and influential content</div>
              <button className="btn-primary" onClick={() => navigate('/studio', { state: { activeTab: 'Content' } })} style={{ padding: '12px 24px', fontSize: '1.1rem', borderRadius: '8px' }}>Upload Video</button>
            </div>
          ) : activeTab === 'Community' ? (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(channelId)}&background=random`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="Avatar" />
                    <div>
                      <div style={{ fontWeight: '600' }}>{channelId}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i} days ago</div>
                    </div>
                  </div>
                  <p style={{ lineHeight: '1.6' }}>Hey everyone! Just dropped a new video tutorial. Make sure to check it out and let me know what you think in the comments. We hit 1.5M subscribers today, thank you so much for the support! 🎉</p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', color: 'var(--text-muted)' }}>
                    <span style={{ cursor: 'pointer' }}>👍 {120 * i}</span>
                    <span style={{ cursor: 'pointer' }}>👎</span>
                    <span style={{ cursor: 'pointer' }}>💬 {45 * i}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
              No playlists found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
