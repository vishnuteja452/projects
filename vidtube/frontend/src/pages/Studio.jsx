import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Studio() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Dashboard');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', description: '', videoFile: null, thumbnail: null });
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const handleUploadChange = (e) => {
    if (e.target.type === 'file') {
      setUploadData({ ...uploadData, [e.target.name]: e.target.files[0] });
    } else {
      setUploadData({ ...uploadData, [e.target.name]: e.target.value });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.videoFile || !uploadData.thumbnail) {
      alert("Please select both a video file and a thumbnail.");
      return;
    }
    
    setIsUploading(true);
    const form = new FormData();
    form.append('title', uploadData.title);
    form.append('description', uploadData.description);
    form.append('videoFile', uploadData.videoFile);
    form.append('thumbnail', uploadData.thumbnail);

    try {
      const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
      const response = await fetch(`${apiBase}/api/v1/videos`, {
        method: 'POST',
        body: form,
        credentials: 'include', // Send the HttpOnly JWT cookies to authenticate
      });
      
      const data = await response.json();
      if (response.ok) {
        alert("Video Uploaded Successfully!");
        setIsUploadModalOpen(false);
        setUploadData({ title: '', description: '', videoFile: null, thumbnail: null });
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Network error connecting to backend API.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderDashboard = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Current Subscribers</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '8px 0' }}>12,450</div>
        <div style={{ color: '#00e676', fontSize: '0.9rem' }}>↑ +450 in last 28 days</div>
      </div>
      
      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Views (28 days)</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '8px 0' }}>1.2M</div>
        <div style={{ color: '#00e676', fontSize: '0.9rem' }}>↑ +12% more than usual</div>
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Estimated Revenue</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '8px 0' }}>$4,250.00</div>
        <div style={{ color: '#00e676', fontSize: '0.9rem' }}>↑ +$500 vs last month</div>
      </div>

      <div style={{ gridColumn: 'span 3', background: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-light)', minHeight: '300px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Latest Video Performance</h3>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ width: '300px', aspectRatio: '16/9', background: '#333', borderRadius: '8px' }}>
            <img src="https://i.ytimg.com/vi/voGZPnZeKdw/hq720.jpg" alt="Video" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>How To Build A PC in 1 Minute</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Ranking by views</div>
                <div style={{ fontWeight: '600' }}>1 of 10</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Views</div>
                <div style={{ fontWeight: '600' }}>145,000</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Impression click-through rate</div>
                <div style={{ fontWeight: '600' }}>6.8%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Average view duration</div>
                <div style={{ fontWeight: '600' }}>4:20</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.2rem' }}>Channel Content</h3>
        <button className="btn-primary" style={{ borderRadius: '6px' }} onClick={() => setIsUploadModalOpen(true)}>Upload Video</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <th style={{ padding: '16px 24px' }}>Video</th>
            <th style={{ padding: '16px 24px' }}>Visibility</th>
            <th style={{ padding: '16px 24px' }}>Date</th>
            <th style={{ padding: '16px 24px' }}>Views</th>
            <th style={{ padding: '16px 24px' }}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map(i => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '120px', aspectRatio: '16/9', background: '#333', borderRadius: '4px' }}>
                  <img src={`https://i.ytimg.com/vi/${i === 1 ? 'voGZPnZeKdw' : i === 2 ? '29eDuMjsEF8' : 'Mho0M1Ns0Rw'}/hq720.jpg`} alt="Video" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '500' }}>My awesome video part {i}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Description goes here...</div>
                </div>
              </td>
              <td style={{ padding: '16px 24px' }}><span style={{ color: '#00e676' }}>Public</span></td>
              <td style={{ padding: '16px 24px' }}>May {10 + i}, 2026</td>
              <td style={{ padding: '16px 24px' }}>{14000 * i}</td>
              <td style={{ padding: '16px 24px' }}>{34 * i}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="main-layout">
      {/* Studio Sidebar */}
      <aside className="sidebar" style={{ width: '250px' }}>
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border-light)' }}>
          <img src={user?.avatar || "https://ui-avatars.com/api/?name=Creator&background=random"} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px', objectFit: 'cover' }} alt="Avatar" />
          <div style={{ fontWeight: '600' }}>{user?.fullName || 'Your Channel'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Creator Studio</div>
        </div>
        <div style={{ padding: '12px 0' }}>
          {['Dashboard', 'Content', 'Analytics', 'Comments', 'Earn'].map(tab => (
            <div 
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ padding: '12px 24px' }}
            >
              {tab}
            </div>
          ))}
        </div>
      </aside>

      {/* Studio Content */}
      <main className="content-area" style={{ background: '#000' }}>
        <h2 className="section-title">Channel {activeTab}</h2>
        {activeTab === 'Dashboard' && renderDashboard()}
        {activeTab === 'Content' && renderContent()}
        {(activeTab === 'Analytics' || activeTab === 'Earn' || activeTab === 'Comments') && (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
            This feature is mocked out for demonstration purposes. Check out Dashboard and Content!
          </div>
        )}
      </main>

      {/* Upload Modal Overlay */}
      {isUploadModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'var(--bg-surface)', padding: '32px', borderRadius: '12px', width: '500px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Upload Video</h2>
              <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Title</label>
                <input type="text" name="title" value={uploadData.title} onChange={handleUploadChange} required className="input-field" placeholder="My awesome video" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description</label>
                <textarea name="description" value={uploadData.description} onChange={handleUploadChange} required className="input-field" rows="4" placeholder="Tell viewers about your video..." style={{ resize: 'vertical' }}></textarea>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Video File (.mp4)</label>
                <input type="file" name="videoFile" onChange={handleUploadChange} required accept="video/*" style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Thumbnail Image</label>
                <input type="file" name="thumbnail" onChange={handleUploadChange} required accept="image/*" style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)' }} />
              </div>
              
              <button type="submit" disabled={isUploading} className="btn-primary" style={{ marginTop: '16px', padding: '12px', borderRadius: '6px', fontSize: '1rem' }}>
                {isUploading ? 'Uploading (Please wait)...' : 'Publish Video'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
