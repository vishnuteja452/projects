import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    avatar: null,
    coverImage: null
  });

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login Flow
        const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
        const response = await fetch(`${apiBase}/api/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          login(data.data.user);
          navigate('/');
        } else {
          alert(data.message || 'Login failed');
        }
      } else {
        // Registration Flow (requires multipart form for files)
        const form = new FormData();
        form.append('email', formData.email);
        form.append('password', formData.password);
        form.append('username', formData.username);
        form.append('fullName', formData.fullName);
        if (formData.avatar) form.append('avatar', formData.avatar);
        if (formData.coverImage) form.append('coverImage', formData.coverImage);

        const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
        const response = await fetch(`${apiBase}/api/users/register`, {
          method: 'POST',
          body: form
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('Channel Created Successfully! Please log in.');
          setIsLogin(true);
        } else {
          alert(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error(error);
      alert("Network error connecting to backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-dark)', padding: '40px 0' }}>
      <div style={{ width: '450px', background: 'var(--bg-surface)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{isLogin ? 'Welcome Back' : 'Create Your Channel'}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            {isLogin ? 'Log in to continue to VidTube' : 'Join VidTube and start sharing videos'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name (Channel Name)</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field" required placeholder="Linus Tech Tips" style={{ borderRadius: '6px', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-field" required placeholder="linustechtips" style={{ borderRadius: '6px', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Avatar Image</label>
                <input type="file" name="avatar" onChange={handleChange} accept="image/*" required style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cover Image (Optional)</label>
                <input type="file" name="coverImage" onChange={handleChange} accept="image/*" style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)' }} />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required placeholder="you@example.com" style={{ borderRadius: '6px', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" required placeholder="••••••••" style={{ borderRadius: '6px', borderRight: '1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px', padding: '12px', fontSize: '1rem', borderRadius: '6px' }}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Channel')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have a channel? " : "Already have a channel? "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--twitch-purple)', cursor: 'pointer', fontWeight: '500' }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </div>
      </div>
    </div>
  );
}
