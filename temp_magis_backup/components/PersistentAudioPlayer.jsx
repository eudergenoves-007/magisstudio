// ─── magis-studio/frontend/src/components/audio/PersistentAudioPlayer.jsx ────
import { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import './PersistentAudioPlayer.css';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function PersistentAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    isMinimized,
    audioRef,
    dispatch,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleMinimized,
  } = useAudioPlayer();

  // ── Audio element event wiring ────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => dispatch({ type: 'SET_TIME', value: audio.currentTime });
    const onDurationChange = () => dispatch({ type: 'SET_DURATION', value: audio.duration });
    const onEnded = () => nextTrack();
    const onPlay = () => dispatch({ type: 'SET_PLAYING', value: true });
    const onPause = () => dispatch({ type: 'SET_PLAYING', value: false });

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  // ── Sync play/pause state to audio element ────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  // ── Load new track ────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const src = currentTrack.files?.mp3_320?.url || currentTrack.files?.flac?.url || currentTrack.streamUrl;
    if (src && audio.src !== src) {
      audio.src = src;
      audio.load();
      if (isPlaying) audio.play().catch(() => {});
    }
  }, [currentTrack]);

  // ── Volume / mute ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) return (
    <div className="player player--idle glass-heavy">
      <audio ref={audioRef} preload="metadata" />
      <p className="player__idle-msg">
        <span className="player__idle-icon">◉</span>
        Selecciona una pista del Laboratorio Sonoro
      </p>
    </div>
  );

  return (
    <div className={`player glass-heavy ${isMinimized ? 'player--minimized' : ''}`}>
      <audio ref={audioRef} preload="metadata" />

      {/* Progress bar — full width, above controls */}
      <div
        className="player__progress"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seekTo(((e.clientX - rect.left) / rect.width) * duration);
        }}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(currentTime)}
        aria-valuemax={Math.round(duration)}
      >
        <div className="player__progress-track">
          <div className="player__progress-fill" style={{ width: `${progressPercent}%` }} />
          <div className="player__progress-thumb" style={{ left: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="player__body">
        {/* ── Track info ───────────────────────────────────────────────────── */}
        <div className="player__info">
          <div className="player__artwork">
            {currentTrack.artwork?.url
              ? <img src={currentTrack.artwork.url} alt={currentTrack.title} />
              : <span className="player__artwork-placeholder">♪</span>
            }
            {isPlaying && <div className="player__artwork-pulse" />}
          </div>
          <div className="player__meta">
            <span className="player__title">{currentTrack.title}</span>
            <span className="player__artist">{currentTrack.artist}</span>
          </div>
          {currentTrack.metadata && (
            <div className="player__quality-badge">
              <span className="badge badge-amber">
                {currentTrack.metadata.bitDepth}bit / {currentTrack.metadata.sampleRate / 1000}kHz
              </span>
            </div>
          )}
        </div>

        {/* ── Transport controls (Neumorphic) ──────────────────────────────── */}
        <div className="player__controls">
          {/* Shuffle */}
          <button
            className={`player__btn player__btn--sm ${isShuffled ? 'is-active' : ''}`}
            onClick={toggleShuffle}
            aria-label="Shuffle"
            title="Shuffle"
          >
            <ShuffleIcon />
          </button>

          {/* Prev */}
          <button className="player__btn" onClick={prevTrack} aria-label="Previous track">
            <PrevIcon />
          </button>

          {/* Play/Pause — primary neumorphic button */}
          <button
            className={`player__btn player__btn--play ${isPlaying ? 'is-playing' : ''}`}
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* Next */}
          <button className="player__btn" onClick={nextTrack} aria-label="Next track">
            <NextIcon />
          </button>

          {/* Repeat */}
          <button
            className={`player__btn player__btn--sm ${repeatMode !== 'none' ? 'is-active' : ''}`}
            onClick={cycleRepeat}
            aria-label="Repeat"
            title={`Repeat: ${repeatMode}`}
          >
            <RepeatIcon mode={repeatMode} />
          </button>
        </div>

        {/* ── Time & Volume ─────────────────────────────────────────────────── */}
        <div className="player__secondary">
          <span className="player__time font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Volume (neumorphic range) */}
          <div className="player__volume">
            <button
              className="player__btn player__btn--xs"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
            </button>
            <div className="player__volume-track">
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="player__volume-slider"
                aria-label="Volume"
              />
              <div
                className="player__volume-fill"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>

          <button
            className="player__btn player__btn--xs"
            onClick={toggleMinimized}
            aria-label={isMinimized ? 'Expand player' : 'Minimize player'}
          >
            {isMinimized ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Icon components ──────────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
const PrevIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="2" height="16" rx="1" />
  </svg>
);
const NextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,4 15,12 5,20" /><rect x="17" y="4" width="2" height="16" rx="1" />
  </svg>
);
const ShuffleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16,3 21,3 21,8" /><line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21,16 21,21 16,21" /><line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);
const RepeatIcon = ({ mode }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17,1 21,5 17,9" /><path d="M3,11V9a4,4,0,0,1,4-4H21" />
    <polyline points="7,23 3,19 7,15" /><path d="M21,13v2a4,4,0,0,1-4,4H3" />
    {mode === 'one' && <text x="9" y="15" fontSize="8" fill="currentColor" stroke="none">1</text>}
  </svg>
);
const VolumeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <path d="M15.54,8.46a5,5,0,0,1,0,7.07" /><path d="M19.07,4.93a10,10,0,0,1,0,14.14" />
  </svg>
);
const MuteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);
const ExpandIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15,3 21,3 21,9" /><polyline points="9,21 3,21 3,15" />
    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);
const CollapseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4,14 10,14 10,20" /><polyline points="20,10 14,10 14,4" />
    <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
  </svg>
);
