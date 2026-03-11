import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications, useMarkNotificationsRead } from '../../hooks/useSocial';
import './social.css';

const NOTIF_ICONS = {
  like:           '♥',
  love:           '✦',
  fire:           '⚡',
  comment:        '○',
  reply:          '↩',
  follow:         '◎',
  follow_request: '◌',
  mention:        '@',
  story_view:     '◑',
  gear_tag:       '◉',
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data }        = useNotifications();
  const markRead        = useMarkNotificationsRead();

  const notifications = data?.data      ?? [];
  const unread        = data?.unreadCount ?? 0;

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unread > 0) markRead.mutate();
  };

  return (
    <div className="notif-bell" aria-haspopup="listbox" aria-expanded={open}>
      <button
        className="notif-bell__btn player__btn"
        onClick={handleOpen}
        aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ''}`}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="notif-bell__badge" aria-live="polite">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="notif-bell__dropdown glass-heavy" role="listbox" aria-label="Notificaciones">
            <div className="notif-bell__header">
              <span className="notif-bell__title font-mono">◈ NOTIFICACIONES</span>
              {unread > 0 && (
                <span className="notif-bell__unread-count badge badge-amber">
                  {unread} nueva{unread !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="notif-bell__list">
              {notifications.length === 0 ? (
                <div className="notif-bell__empty">
                  <span className="notif-bell__empty-icon" aria-hidden="true">◎</span>
                  <p>Sin notificaciones nuevas</p>
                </div>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <NotifItem key={n._id} notif={n} onClose={() => setOpen(false)} />
                ))
              )}
            </div>
          </div>
          <div className="notif-bell__overlay" onClick={() => setOpen(false)} aria-hidden="true" />
        </>
      )}
    </div>
  );
}

function NotifItem({ notif, onClose }) {
  const href = resolveLink(notif);
  const content = (
    <div className={`notif-item ${!notif.isRead ? 'is-unread' : ''}`} role="option">
      <div className="notif-item__avatar">
        {notif.sender?.avatar?.url
          ? <img src={notif.sender.avatar.url} alt={notif.sender.username} />
          : <span>{notif.sender?.username?.[0]?.toUpperCase() ?? '?'}</span>
        }
        <span className="notif-item__type-icon" aria-hidden="true">{NOTIF_ICONS[notif.type] ?? '◎'}</span>
      </div>
      <div className="notif-item__body">
        <p className="notif-item__msg">{notif.message}</p>
        <span className="notif-item__time font-mono">{timeAgo(notif.createdAt)}</span>
      </div>
      {!notif.isRead && <span className="notif-item__dot" aria-hidden="true" />}
    </div>
  );
  return href ? <Link to={href} onClick={onClose} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

function resolveLink(notif) {
  if (!notif.entity) return null;
  if (notif.entity.kind === 'Post')    return `/social/${notif.entity.id}`;
  if (notif.entity.kind === 'User')    return `/perfil/${notif.sender?.username}`;
  return null;
}

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
