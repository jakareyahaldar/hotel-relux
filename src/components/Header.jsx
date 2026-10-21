import { useEffect, useState } from 'react';
import { HOTEL } from '../data/hotel.js';
import logo from '../data/images/logo.png';
import { IconPhone } from './icons.jsx';

const NAV_LINKS = [
  { href: '#rooms', label: 'রুম' },
  { href: '#gallery', label: 'গ্যালারি' },
  { href: '#amenities', label: 'সুবিধা' },
  { href: '#reviews', label: 'প্রশংসা' },
  { href: '#faq', label: 'প্রশ্নোত্তর' },
  { href: '#manage', label: 'আমার বুকিং' },
  { href: '#contact', label: 'যোগাযোগ' },
];

export default function Header({ onBook }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.classList.toggle('no-scroll', menuOpen);
    return () => document.body.classList.remove('no-scroll');
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`header ${scrolled ? 'header--solid' : ''}`}>
        <div className="container header__inner">
          <a href="#top" className="header__brand" onClick={closeMenu}>
            <img src={logo} alt={HOTEL.shortName} className="header__logo" />
            <span className="header__brand-text">
              <span className="header__brand-name">{HOTEL.shortName}</span>
              <span className="header__brand-sub">আবাসিক হোটেল</span>
            </span>
          </a>

          <nav className="header__nav" aria-label="প্রধান নেভিগেশন">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="header__link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="header__actions">
            <a href={`tel:${HOTEL.phoneRaw}`} className="header__call">
              <IconPhone size={15} />
              {HOTEL.phoneDisplay}
            </a>
            <button type="button" className="btn btn--gold btn--sm" onClick={onBook}>
              রুম বুক করুন
            </button>
            <button
              type="button"
              className={`header__burger ${menuOpen ? 'header__burger--open' : ''}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              aria-expanded={menuOpen}
            >
              <span className="header__burger-lines">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="mobile-menu__link" onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <div className="mobile-menu__actions">
            <button
              type="button"
              className="btn btn--gold btn--block"
              onClick={() => {
                closeMenu();
                onBook();
              }}
            >
              রুম বুক করুন
            </button>
            <a href={`tel:${HOTEL.phoneRaw}`} className="btn btn--call btn--block">
              <IconPhone size={17} />
              কল করুন {HOTEL.phoneDisplay}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
