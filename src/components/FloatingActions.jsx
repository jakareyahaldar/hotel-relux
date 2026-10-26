import { useState } from 'react';
import { HOTEL } from '../data/hotel.js';
import { buildGeneralWhatsAppLink } from '../utils/pricing.js';
import { IconAlert, IconPhone, IconWhatsApp } from './icons.jsx';

/**
 * Floating WhatsApp, phone and notice buttons.
 * These stay visible on every screen so a guest can always reach the hotel
 * with one tap. The notice button carries a "NEW" badge until it has been
 * opened at least once.
 */
export default function FloatingActions({ onNotice }) {
  const [hasNewNotice, setHasNewNotice] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('hotelRelaxNoticeSeen') !== '1';
  });

  const openNotice = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hotelRelaxNoticeSeen', '1');
    }
    setHasNewNotice(false);
    onNotice?.();
  };

  return (
    <div className="fab-stack">
      <a
        href={buildGeneralWhatsAppLink()}
        className="fab fab--whatsapp"
        target="_blank"
        rel="noreferrer"
        aria-label={`হোয়াটসঅ্যাপে ${HOTEL.shortName}-এর সাথে কথা বলুন`}
      >
        <IconWhatsApp size={20} className="fab__icon" />
        <span className="fab__label">হোয়াটসঅ্যাপ</span>
      </a>

      <a
        href={`tel:${HOTEL.phoneRaw}`}
        className="fab fab--call"
        aria-label={`${HOTEL.shortName}-কে ${HOTEL.phoneDisplay} নম্বরে কল করুন`}
      >
        <IconPhone size={20} className="fab__icon" />
        <span className="fab__label">কল করুন</span>
      </a>

      <button
        type="button"
        className="fab fab--notice"
        onClick={openNotice}
        aria-label="নোটিশ দেখুন"
      >
        <IconAlert size={20} className="fab__icon" />
        <span className="fab__label">নোটিশ</span>
        {hasNewNotice && <span className="fab__badge">NEW</span>}
      </button>
    </div>
  );
}
