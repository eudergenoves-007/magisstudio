// ─── magis-studio/frontend/src/components/social/PostCard.jsx ────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReactToPost, useAddComment, useToggleSave, useDeletePost } from '../../hooks/useSocial';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import './social.css';

const REACTIONS = [
  { type: 'like',     emoji: '♥',  label: 'Me gusta'  },
  { type: 'love',     emoji: '✦',  label: 'Amor'      },
  { type: 'fire',     emoji: '⚡', label: 'Fuego'     },
  { type: 'wave',     emoji: '〜', label: 'Ola'       },
  { type: 'gold_ear', emoji: '◎',  label: 'Buen oído' },
];

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400)return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

export default function PostCard({ post, currentUser }) {
  const [mediaIndex, setMediaIndex]   = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu]       = useState(false);

  const reactMutation   = useReactToPost();
  const commentMutation = useAddComment(post._id);
  const saveMutation    = useToggleSave();
  const deleteMutation  = useDeletePost();
  const { playTrack }   = useAudioPlayer();

  const isOwner = currentUser?._id === post.author?._id;

  const handleReact = (type) => {
    setShowReactions(false);
    reactMutation.mutate({ postId: post._id, type });
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate({ body: commentText });
    setCommentText('');
  };

  const handlePlayTrack = () => {
    if (post.linkedTrack?.item) playTrack(post.linkedTrack.item);
  };

  return (
    <article className="post-card glass" aria-label={`Post de ${post.author?.username}`}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="post-card__header">
        <Link to={`/perfil/${post.author?.username}`} className="post-card__author">
          <div className="post-card__avatar">
            {post.author?.avatar?.url
              ? <img src={post.author.avatar.url} alt={post.author.username} />
              : <span>{post.author?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="post-card__author-meta">
            <span className="post-card__username">{post.author?.displayName || post.author?.username}</span>
            <span className="post-card__handle font-mono">@{post.author?.username}</span>
          </div>
        </Link>

        <div className="post-card__header-right">
          <span className="post-card__time font-mono">{timeAgo(post.createdAt)}</span>
          <div className="post-card__menu-wrap">
            <button className="post-card__menu-btn" onClick={() => setShowMenu(v => !v)} aria-label="Opciones">
              ···
            </button>
            {showMenu && (
              <div className="post-card__menu glass-heavy">
                {isOwner && (
                  <button
                    className="post-card__menu-item post-card__menu-item--danger"
                    onClick={() => { deleteMutation.mutate(post._id); setShowMenu(false); }}
                  >
                    Eliminar
                  </button>
                )}
                <button className="post-card__menu-item" onClick={() => setShowMenu(false)}>
                  Reportar
                </button>
                <button className="post-card__menu-item" onClick={() => { navigator.clipboard.writeText(window.location.origin + '/social/' + post._id); setShowMenu(false); }}>
                  Copiar enlace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Media carousel ──────────────────────────────────────────────── */}
      {post.media?.length > 0 && (
        <div className="post-card__media">
          <div className="post-card__media-frame">
            {post.media[mediaIndex]?.type === 'video' ? (
              <video
                src={post.media[mediaIndex].url}
                controls
                className="post-card__video"
                aria-label="Video del post"
              />
            ) : (
              <img
                src={post.media[mediaIndex].url}
                alt={post.media[mediaIndex].altText || `Imagen de ${post.author?.username}`}
                className="post-card__image"
                loading="lazy"
              />
            )}
          </div>

          {/* Carousel dots */}
          {post.media.length > 1 && (
            <div className="post-card__dots" role="tablist" aria-label="Imágenes">
              {post.media.map((_, i) => (
                <button
                  key={i}
                  className={`post-card__dot ${i === mediaIndex ? 'is-active' : ''}`}
                  onClick={() => setMediaIndex(i)}
                  role="tab"
                  aria-selected={i === mediaIndex}
                  aria-label={`Imagen ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Carousel arrows */}
          {post.media.length > 1 && (
            <>
              {mediaIndex > 0 && (
                <button className="post-card__arrow post-card__arrow--prev"
                  onClick={() => setMediaIndex(v => v - 1)} aria-label="Anterior">‹</button>
              )}
              {mediaIndex < post.media.length - 1 && (
                <button className="post-card__arrow post-card__arrow--next"
                  onClick={() => setMediaIndex(v => v + 1)} aria-label="Siguiente">›</button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Linked gear ─────────────────────────────────────────────────── */}
      {post.linkedGear?.item && (
        <Link to={`/gear/${post.linkedGear.item.slug}`} className="post-card__gear-link glass-light">
          <span className="post-card__gear-icon" aria-hidden="true">◉</span>
          <div className="post-card__gear-info">
            <span className="post-card__gear-label font-mono">GEAR</span>
            <span className="post-card__gear-name">
              {post.linkedGear.item.brand} {post.linkedGear.item.name}
            </span>
            {post.linkedGear.note && (
              <span className="post-card__gear-note">{post.linkedGear.note}</span>
            )}
          </div>
          <span className="post-card__gear-score badge badge-amber">
            {post.linkedGear.item.review?.scores?.overall}/10
          </span>
        </Link>
      )}

      {/* ── Linked track ────────────────────────────────────────────────── */}
      {post.linkedTrack?.item && (
        <button className="post-card__track-link glass-light" onClick={handlePlayTrack}>
          <div className="post-card__track-artwork">
            {post.linkedTrack.item.artwork?.url
              ? <img src={post.linkedTrack.item.artwork.url} alt={post.linkedTrack.item.title} />
              : <span>♪</span>
            }
            <div className="post-card__track-play" aria-hidden="true">▶</div>
          </div>
          <div className="post-card__track-info">
            <span className="post-card__track-label font-mono">TRACK</span>
            <span className="post-card__track-name">{post.linkedTrack.item.title}</span>
            <span className="post-card__track-artist">{post.linkedTrack.item.artist}</span>
          </div>
          {post.linkedTrack.item.metadata && (
            <span className="badge badge-amber">
              {post.linkedTrack.item.metadata.bitDepth}bit
            </span>
          )}
        </button>
      )}

      {/* ── Actions row ─────────────────────────────────────────────────── */}
      <div className="post-card__actions">
        <div className="post-card__actions-left">
          {/* Reaction button with picker */}
          <div className="post-card__reaction-wrap">
            <button
              className={`post-card__action-btn ${post.viewerReaction ? 'is-reacted' : ''}`}
              onClick={() => post.viewerReaction ? handleReact(post.viewerReaction) : setShowReactions(v => !v)}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
              aria-label="Reaccionar"
            >
              <span className="post-card__reaction-icon">
                {post.viewerReaction
                  ? REACTIONS.find(r => r.type === post.viewerReaction)?.emoji || '♥'
                  : '♡'
                }
              </span>
              <span className="post-card__action-count">{post.reactionCount || 0}</span>
            </button>

            {/* Reaction picker */}
            {showReactions && (
              <div
                className="post-card__reaction-picker glass-heavy"
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                role="toolbar" aria-label="Elegir reacción"
              >
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    className={`post-card__reaction-opt ${post.viewerReaction === r.type ? 'is-active' : ''}`}
                    onClick={() => handleReact(r.type)}
                    aria-label={r.label}
                    title={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment toggle */}
          <button
            className="post-card__action-btn"
            onClick={() => setShowComments(v => !v)}
            aria-label="Comentarios"
            aria-expanded={showComments}
          >
            <span>○</span>
            <span className="post-card__action-count">{post.commentCount || 0}</span>
          </button>

          {/* Share (copy link) */}
          <button className="post-card__action-btn" aria-label="Compartir"
            onClick={() => navigator.clipboard.writeText(window.location.origin + '/social/' + post._id)}>
            <span>↗</span>
          </button>
        </div>

        {/* Save */}
        <button
          className={`post-card__action-btn ${post.isSaved ? 'is-saved' : ''}`}
          onClick={() => saveMutation.mutate(post._id)}
          aria-label={post.isSaved ? 'Quitar guardado' : 'Guardar'}
          aria-pressed={post.isSaved}
        >
          {post.isSaved ? '◆' : '◇'}
        </button>
      </div>

      {/* ── Caption ─────────────────────────────────────────────────────── */}
      {post.caption && (
        <div className="post-card__caption">
          <span className="post-card__caption-author">{post.author?.username}</span>{' '}
          <span className="post-card__caption-text">{post.caption}</span>
          {post.hashtags?.length > 0 && (
            <div className="post-card__hashtags">
              {post.hashtags.slice(0, 5).map(tag => (
                <Link key={tag} to={`/social/explore?hashtag=${tag}`} className="post-card__hashtag">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Comments section ────────────────────────────────────────────── */}
      {showComments && (
        <div className="post-card__comments">
          {/* Existing comments */}
          {post.comments?.filter(c => !c.isDeleted).slice(0, 5).map((comment) => (
            <div key={comment._id} className="post-card__comment">
              <Link to={`/perfil/${comment.author?.username}`} className="post-card__comment-avatar">
                {comment.author?.avatar?.url
                  ? <img src={comment.author.avatar.url} alt={comment.author.username} />
                  : <span>{comment.author?.username?.[0]?.toUpperCase()}</span>
                }
              </Link>
              <div className="post-card__comment-body">
                <span className="post-card__comment-author">{comment.author?.username}</span>{' '}
                <span className="post-card__comment-text">{comment.body}</span>
                <span className="post-card__comment-time font-mono">{timeAgo(comment.createdAt)}</span>
              </div>
            </div>
          ))}

          {/* New comment input */}
          {currentUser && (
            <form className="post-card__comment-form" onSubmit={handleComment}>
              <div className="post-card__comment-avatar post-card__comment-avatar--sm">
                {currentUser.avatar?.url
                  ? <img src={currentUser.avatar.url} alt={currentUser.username} />
                  : <span>{currentUser.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Añade un comentario..."
                className="post-card__comment-input"
                maxLength={1000}
                aria-label="Escribir comentario"
              />
              <button
                type="submit"
                className="post-card__comment-submit"
                disabled={!commentText.trim() || commentMutation.isPending}
                aria-label="Publicar comentario"
              >
                ↵
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
