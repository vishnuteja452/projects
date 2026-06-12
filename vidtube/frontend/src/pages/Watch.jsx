import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import videosData from '../data/videos.json';

export default function Watch() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const video = location.state?.video || videosData.find(v => v.thumbnail.includes(id)) || videosData[0];

  const channelName = video.owner.fullname;
  const [isSubscribed, setIsSubscribed] = useState(() => {
    const subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    return subs.includes(channelName);
  });
  const [comments, setComments] = useState([
    { id: 1, user: "TechEnthusiast", text: "This is exactly what I was looking for! Great tutorial.", likes: 142 },
    { id: 2, user: "LinuxLover", text: "Can you make a part 2 covering advanced topics?", likes: 89 },
    { id: 3, user: "PCBuilder99", text: "The editing on this video is so crisp. Well done.", likes: 45 }
  ]);
  const [newComment, setNewComment] = useState("");

  // Add to watch history
  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      const historyStr = localStorage.getItem('watchHistory');
      let history = historyStr ? JSON.parse(historyStr) : [];
      // Remove if exists to push to front
      history = history.filter(v => v.id !== video.id);
      history.unshift(video);
      localStorage.setItem('watchHistory', JSON.stringify(history));
    }
  }, [video]);

  const handleSubscribe = () => {
    const newSubState = !isSubscribed;
    setIsSubscribed(newSubState);
    
    let subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    if (newSubState) {
      if (!subs.includes(channelName)) subs.push(channelName);
    } else {
      subs = subs.filter(name => name !== channelName);
    }
    localStorage.setItem('subscriptions', JSON.stringify(subs));
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const commentObj = {
      id: Date.now(),
      user: "You",
      text: newComment,
      likes: 0
    };
    
    setComments([commentObj, ...comments]);
    setNewComment("");
  };

  return (
    <div className="watch-page" style={{ padding: '24px', flex: 1, overflowY: 'auto', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px' }}>
        
        {/* Main Video Section */}
        <div style={{ flex: '1' }}>
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${id}?autoplay=1`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
          </div>
          
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '16px 0 8px', color: 'var(--text-main)' }}>
            {video.title}
          </h1>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src={video.owner.avatar} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }} 
                alt={video.owner.fullname}
                onClick={() => navigate(`/channel/${encodeURIComponent(video.owner.fullname)}`)}
              />
              <div>
                <div style={{ fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate(`/channel/${encodeURIComponent(video.owner.fullname)}`)}>
                  {video.owner.fullname}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>1.2M subscribers</div>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleSubscribe}
                style={{ 
                  marginLeft: '16px', 
                  background: isSubscribed ? 'var(--bg-surface-hover)' : '#fff', 
                  color: isSubscribed ? 'var(--text-main)' : '#000', 
                  borderRadius: '20px' 
                }}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ borderRadius: '20px' }}>👍 Like</button>
              <button className="btn-secondary" style={{ borderRadius: '20px' }}>👎 Dislike</button>
              <button className="btn-secondary" style={{ borderRadius: '20px' }}>Share</button>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '24px' }}>
            <span style={{ fontWeight: '600' }}>{video.views} views • {video.publishedAt}</span>
            <p style={{ marginTop: '8px', color: 'var(--text-main)' }}>This is the description of the video. It would contain details about what the video covers, links, and more information about the channel.</p>
          </div>

          {/* Comments Section */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>{comments.length} Comments</h3>
            
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <img src="https://ui-avatars.com/api/?name=You&background=random" style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="You" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..." 
                  style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '8px 0', outline: 'none' }} 
                />
                {newComment && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setNewComment("")} style={{ borderRadius: '20px' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ borderRadius: '20px' }}>Comment</button>
                  </div>
                )}
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '16px' }}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.user)}&background=random`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt={c.user} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>@{c.user} <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '4px' }}>2 days ago</span></div>
                    <div style={{ fontSize: '0.95rem' }}>{c.text}</div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span style={{ cursor: 'pointer' }}>👍 {c.likes > 0 ? c.likes : ''}</span>
                      <span style={{ cursor: 'pointer' }}>👎</span>
                      <span style={{ cursor: 'pointer' }}>Reply</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Up Next / Recommendations */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Up Next</h3>
          {videosData.slice(0, 15).filter(v => v.id !== video.id).slice(0, 10).map((recVideo, i) => {
            const recId = recVideo.thumbnail.split('/vi/')[1]?.split('/')[0] || '';
            return (
              <div 
                key={i} 
                style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}
                onClick={() => navigate(`/watch/${recId}`, { state: { video: recVideo } })}
              >
                <div style={{ width: '140px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={recVideo.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Thumb" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{recVideo.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{recVideo.owner.fullname}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{recVideo.views} views</div>
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
}
