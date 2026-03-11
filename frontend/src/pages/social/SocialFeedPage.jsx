// ─── magis-studio/frontend/src/pages/SocialFeedPage.jsx ──────────────────────
import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFeed, useStories } from '../../hooks/useSocial';
import PostCard from '../../components/social/PostCard';
import StoriesBar from '../../components/social/StoriesBar';
import CreatePostModal from '../../components/social/CreatePostModal';
// import NotificationBell from '../../components/social/NotificationBell';
import './SocialFeedPage.css';

export default function SocialFeedPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  const {
    data, fetchNextPage, hasNextPage,
    isFetchingNextPage, isLoading, isError,
  } = useFeed();

  const { data: storiesData } = useStories();

  // Infinite scroll sentinel
  const observerRef = useRef(null);
  const sentinelRef = useCallback((node) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap(p => p.data) ?? [];

  return (
    <div className="social-page page-container">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="social-header">
        <div className="social-header__left">
          <h1 className="social-header__title">
            <span className="text-amber">◈</span> Studio Feed
          </h1>
          <p className="social-header__sub font-mono">La comunidad Magis</p>
        </div>
        <div className="social-header__actions">
          {/* <NotificationBell /> */}
          <button
            className="social-create-btn"
            onClick={() => setShowCreate(true)}
            aria-label="Nueva publicación"
          >
            <span aria-hidden="true">+</span>
            <span>Publicar</span>
          </button>
        </div>
      </header>

      {/* ── Stories bar ─────────────────────────────────────────────────── */}
      {storiesData && storiesData.length > 0 && (
        <StoriesBar groups={storiesData} currentUser={user} /> */}
      )}

      {/* ── Feed ────────────────────────────────────────────────────────── */}
      <div className="social-feed">
        {isLoading && (
          <div className="social-feed__skeletons">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="post-skeleton glass">
                <div className="post-skeleton__header">
                  <div className="skeleton post-skeleton__avatar" /> */}
                  <div className="post-skeleton__meta">
                    <div className="skeleton post-skeleton__name" /> */}
                    <div className="skeleton post-skeleton__time" /> */}
                  </div>
                </div>
                <div className="skeleton post-skeleton__image" /> */}
                <div className="post-skeleton__footer">
                  <div className="skeleton post-skeleton__actions" /> */}
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="social-feed__error glass">
            <span>⚠</span>
            <p>No se pudo cargar el feed. Intenta de nuevo.</p>
          </div>
        )}

        {!isLoading && allPosts.length === 0 && (
          <div className="social-feed__empty glass">
            <span className="social-feed__empty-icon" aria-hidden="true">◎</span>
            <h3>El feed está vacío</h3>
            <p>Sigue a otros usuarios o sé el primero en publicar.</p>
            <button className="social-create-btn" onClick={() => setShowCreate(true)}>
              Crear primera publicación
            </button>
          </div>
        )}

        {allPosts.map((post) => (
          <PostCard key={post._id} post={post} currentUser={user} /> */}
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="social-feed__sentinel" aria-hidden="true" /> */}

        {isFetchingNextPage && (
          <div className="social-feed__loading-more">
            <div className="social-feed__spinner" aria-label="Cargando más..." /> */}
          </div>
        )}

        {!hasNextPage && allPosts.length > 0 && (
          <p className="social-feed__end font-mono">— fin del feed —</p>
        )}
      </div>

      {/* ── Create post modal ────────────────────────────────────────────── */}
      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} /> */}
      )}
    </div>
  );
}
