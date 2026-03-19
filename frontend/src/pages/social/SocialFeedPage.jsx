import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFeed, useStories } from '../../hooks/useSocial';
import PostCard from '../../components/social/PostCard';
import StoriesBar from '../../components/social/StoriesBar';
import CreatePostModal from '../../components/social/CreatePostModal';

import './social.css';

export default function SocialFeedPage() {
  const { user } = useAuth();
  const { data: feed, isLoading } = useFeed();
  const { data: stories } = useStories();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="social-container animate-fade-in">
      <header className="social-header glass">
        <h1 className="section__title">Magis <span className="text-amber">Social</span></h1>
        <div className="social-actions">
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Publicar
          </button>
        </div>
      </header>

      <main className="social-content">
        <StoriesBar stories={stories} />
        
        <div className="feed-grid">
          {isLoading ? (
            <p className="loading-text">Sintonizando el feed...</p>
          ) : (
            feed?.pages?.[0]?.data?.length > 0 ? (
              feed.pages.flatMap(page => page.data || []).map(post => <PostCard key={post._id} post={post} />)
            ) : (
              <div className="social-feed__empty glass">
                <h3 className="text-amber">No hay publicaciones</h3>
                <p>Sé el primero en compartir algo con la comunidad.</p>
              </div>
            )
          )}
        </div>
      </main>

      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}