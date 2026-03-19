import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import './HomePage.css';

const FEATURED_GEAR = [
  { _id: '1', slug: 'yamaha-hs8', brand: 'Yamaha', name: 'HS8 Studio Monitor', category: 'studio_monitor', review: { scores: { overall: 9.2 }, excerpt: 'El estándar de referencia para mezcla nearfield. Respuesta plana implacable.' }, currentPrice: { amount: 799, currency: 'USD' }, isFeatured: true, isEditorsPick: true, media: [], },
  { _id: '2', slug: 'focusrite-scarlett-4i4', brand: 'Focusrite', name: 'Scarlett 4i4 Gen 4', category: 'audio_interface', review: { scores: { overall: 8.8 }, excerpt: 'Preamps Air mejorados. La interfaz perfecta para el home studio profesional.' }, currentPrice: { amount: 249, currency: 'USD' }, isFeatured: true, media: [], },
  { _id: '3', slug: 'sennheiser-hd-600', brand: 'Sennheiser', name: 'HD 600', category: 'headphones', review: { scores: { overall: 9.5 }, excerpt: 'Tres décadas de legado. La referencia absoluta en auriculares abiertos de alta fidelidad.' }, currentPrice: { amount: 399, currency: 'USD' }, isFeatured: true, isEditorsPick: true, media: [], },
];

// ─── TUS CANCIONES REALES DESDE CLOUDINARY ────────────────────────────────────
const DEMO_TRACK = {
  _id: 'amber-001',
  title: 'Frecuencia Ámbar',
  artist: 'Magis',
  artwork: null,
  files: { mp3_320: { url: 'https://res.cloudinary.com/dilmwlnux/video/upload/v1773951039/magis_studio/frecuencia_ambar_v2_final.mp3' } },
  metadata: { bitDepth: 24, sampleRate: 96000, durationSeconds: 240 },
  accessLevel: 'public',
};

const CATEGORY_ICONS = { studio_monitor: '◉', audio_interface: '⬡', headphones: '◑', dac_amp: '△', microphone: '⊕', preamp: '▣', };

export default function HomePage() {
  const { playTrack, currentTrack } = useAudioPlayer();
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => { if (heroRef.current) { heroRef.current.style.setProperty('--scroll-y', `${window.scrollY * 0.4}px`); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="home">
      {/* ── HERO ── */}
      <section className="hero" ref={heroRef} aria-label="Hero">
        <div className="hero__bg" aria-hidden="true">
          <div className="hero__bg-grid" />
          <video autoPlay loop muted playsInline className="hero__video"><source src="/assets/hero-bg.mp4" type="video/mp4" /></video>
          <div className="hero__bg-orb hero__bg-orb--amber" />
          <div className="hero__bg-orb hero__bg-orb--cyan" />
          <div className="hero__scan-line" />
        </div>
        <div className="hero__content page-container">
          <div className="hero__eyebrow animate-fade-up">
            <span className="badge badge-amber"><span>◉</span> Audio High-End</span>
          </div>
          <h1 className="hero__title animate-fade-up" style={{ animationDelay: '0.1s' }}>Donde el sonido<br /><em className="hero__title-em">cobra forma</em></h1>
          <p className="hero__subtitle animate-fade-up" style={{ animationDelay: '0.2s' }}>Reseñas técnicas de equipo profesional e ingeniería sonora inspirada en el legado de Gustavo Cerati y Zoé.</p>
          <div className="hero__actions animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/gear" className="hero__btn hero__btn--primary">Explorar Gear Vault</Link>
            <button className="hero__btn hero__btn--ghost" onClick={() => playTrack(DEMO_TRACK)}>
              <span className="hero__btn-icon">▶</span> Escuchar Frecuencia Ámbar
            </button>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN LAB ── */}
      <section className="section section--lab">
        <div className="page-container">
          <div className="lab-banner glass-amber">
            <div className="lab-banner__left">
              <p className="section__eyebrow">Streaming Hi-Fi</p>
              <h2 className="section__title">Laboratorio Sonoro</h2>
              <p className="lab-banner__desc">Material de referencia para calibrar tu sistema. Audio sin compresión directo desde la nube.</p>
              <div className="lab-banner__actions">
                <button className="hero__btn hero__btn--primary" onClick={() => playTrack(DEMO_TRACK)}>
                  {currentTrack?._id === DEMO_TRACK._id ? 'Reproduciendo...' : 'Play Demo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
