import { HOTEL } from '../data/hotel.js';
import { buildGeneralWhatsAppLink } from '../utils/pricing.js';
import { IconPhone, IconWhatsApp } from './icons.jsx';

/**
 * Floating WhatsApp and phone buttons.
 * These stay visible on every screen so a guest can always reach the hotel
 * with one tap.
 */
export default function FloatingActions() {
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
    </div>
  );
}
