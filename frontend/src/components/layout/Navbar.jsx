import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/gear',        label: 'Gear Vault',  tag: 'Catálogo' },
  { to: '/laboratorio', label: 'Laboratorio', tag: 'Sonoro'   },
  { to: '/descargas',   label: 'Bóveda',      tag: 'Descargas'},
  { to: '/social',      label: 'Red Social',  tag: 'Comunidad'},
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} aria-label="Main navigation">
      <div className="navbar__ambient-line" aria-hidden="true" />
      <div className="navbar__inner page-container">
        <Link to="/" className="navbar__logo" aria-label="Magis Studio home">
          <span className="navbar__logo-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
              <circle cx="14" cy="14" r="8"  stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <circle cx="14" cy="14" r="3"  fill="currentColor" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <line
                  key={i}
                  x1="14" y1="2" x2="14" y2={i % 2 === 0 ? "4.5" : "3.5"}
                  stroke="currentColor" strokeWidth="1" opacity="0.5"
                  transform={`rotate(${angle} 14 14)`}
                />
              ))}
            </svg>
          </span>
          <span className="navbar__logo-text">
            <span className="navbar__logo-brand">MAGIS</span>
            <span className="navbar__logo-studio">STUDIO</span>
          </span>
        </Link>
        <ul className="navbar__links" role="list">
          {NAV_LINKS.map(({ to, label, tag }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
                <span className="navbar__link-tag">{tag}</span>
                <span className="navbar__link-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="navbar__actions">
          {user ? (
            <div className="navbar__user">
              <Link to="/perfil" className="navbar__avatar" title={user.displayName || user.username}>
                {user.avatar?.url ? <img src={user.avatar.url} alt={user.username} /> : <span>{(user.displayName || user.username)[0].toUpperCase()}</span>}
              </Link>
              <button onClick={logout} className="navbar__btn navbar__btn--ghost" aria-label="Cerrar sesión">Salir</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar__btn navbar__btn--ghost">Ingresar</Link>
              <Link to="/registro" className="navbar__btn navbar__btn--primary">Registrarse</Link>
            </>
          )}
        </div>
        <button className={`navbar__hamburger ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>
      <div className={`navbar__mobile-menu ${menuOpen ? 'is-visible' : ''}`} aria-hidden={!menuOpen}>
        <ul role="list">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}><NavLink to={to} className="navbar__mobile-link">{label}</NavLink></li>
          ))}
          <li className="navbar__mobile-divider" />
          {user ? (
            <li><button onClick={logout} className="navbar__mobile-link">Cerrar Sesión</button></li>
          ) : (
            <>
              <li><Link to="/login" className="navbar__mobile-link">Ingresar</Link></li>
              <li><Link to="/registro" className="navbar__mobile-link navbar__mobile-link--cta">Registrarse</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
