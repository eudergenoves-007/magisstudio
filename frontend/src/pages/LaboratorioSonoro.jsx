import React from 'react';

export default function LaboratorioSonoro() {
  return (
    <div className="laboratorio-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 className="text-amber text-center" style={{ marginBottom: '10px' }}>Laboratorio Sonoro</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '18px', textAlign: 'center' }}>
        Exploración audiovisual, sintetizadores y sesiones originales.
      </p>
      
      {/* Contenedor del Video de Frecuencia Ámbar */}
      <div className="video-wrapper" style={{ 
        position: 'relative', 
        paddingBottom: '56.25%', 
        height: 0, 
        overflow: 'hidden', 
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(232, 168, 66, 0.15)',
        border: '1px solid rgba(232, 168, 66, 0.3)',
        background: 'var(--neu-bg)'
      }}>
        <iframe 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          src="https://www.youtube.com/embed/-YTVV9F7FP0?si=Nh_xwGa2shFECotU&rel=0&theme=dark&color=white" 
          title="Frecuencia Ámbar (Inspirado en Cerati / Zoé) - Canción Original" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen>
        </iframe>
      </div>
    </div>
  );
}
