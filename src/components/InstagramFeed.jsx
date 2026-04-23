import React, { useState, useEffect } from 'react';

const InstagramFeed = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://feeds.behold.so/yFX23kiBO5D7Q20986K0')
      .then(res => res.json())
      .then(data => {
        if (data && data.posts) {
          setFeed(data.posts.slice(0, 6));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching Instagram feed:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div id="insta-feed-widget" className="insta-feed-placeholder">
        <div className="insta-grid-simulated">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="insta-item">
              <div className="placeholder-img insta-img"></div>
            </div>
          ))}
        </div>
        <div className="insta-overlay-msg">
          <p>Conectando ao feed de @ojonquecortou...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insta-grid-real">
      {feed.map((post) => (
        <a 
          key={post.id} 
          href={post.permalink} 
          target="_blank" 
          rel="noreferrer" 
          className="insta-item-link"
        >
          <div className="insta-item">
            <img 
              src={post.thumbnailUrl || post.mediaUrl} 
              alt="Post Studio Jon" 
              className="insta-img-real" 
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x400?text=Instagram+Post';
              }}
            />
            <div className="insta-item-hover">
               <span>Ver no Instagram</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default InstagramFeed;
