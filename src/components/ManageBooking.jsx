import { useState } from 'react';
import { HOTEL } from '../data/hotel.js';
import { getBooking, cancelBooking } from '../utils/bookingActions.js';
import { formatPrice, buildAmendWhatsAppLink } from '../utils/pricing.js';
import { humanDate } from '../utils/dates.js';
import { formatNumber } from '../utils/format.js';
import { IconPhone, IconWhatsApp } from './icons.jsx';

/**
 * Lets a guest look up an existing booking using the reference they received,
 * and cancel it if plans change.
 */
export default function ManageBooking({ onAvailabilityChange }) {
  const [reference, setReference] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  const handleLookup = (event) => {
    event.preventDefault();
    setError('');
    const key = reference.trim().toUpperCase();
    if (!key) {
      setError('অনুগ্রহ করে আপনার বুকিং রেফারেন্স লিখুন।');
      return;
    }
    const found = getBooking(key);
    if (!found) {
      setBooking(null);
      setError('এই রেফারেন্সে কোনো বুকিং পাওয়া যায়নি। একবার মিলিয়ে দেখে আবার চেষ্টা করুন।');
      return;
    }
    setBooking(found);
  };

  const handleCancel = () => {
    const cancelled = cancelBooking(booking.reference);
    if (cancelled) {
      setBooking(cancelled);
      // The room is free again - let the rest of the page re-read availability.
      onAvailabilityChange?.();
    }
  };

  return (
    <section className="section section--sand" id="manage">
      <div className="container">
        <div className="section__head section__head--center">
          <span className="eyebrow">আপনার সংরক্ষণ</span>
          <h2 className="section__title">বুকিং দেখুন বা পরিবর্তন করুন</h2>
          <p className="section__lead">
            রেফারেন্সটি হলো আমাদের পাঠানো কোডটি — RLX-XXXXXX আকারে।
          </p>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <form onSubmit={handleLookup} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 240px' }}>
              <label className="field__label" htmlFor="lookup-reference">
                বুকিং রেফারেন্স
              </label>
              <input
                id="lookup-reference"
                type="text"
                className="field__input"
                placeholder="RLX-7F3K2Q"
                value={reference}
                onChange={(event) => setReference(event.target.value.toUpperCase())}
              />
            </div>
            <button type="submit" className="btn btn--primary" style={{ alignSelf: 'flex-end' }}>
              বুকিং খুঁজুন
            </button>
          </form>

          {error && (
            <p className="field__error" style={{ marginTop: 12, textAlign: 'center' }}>
              {error}
            </p>
          )}

          {booking && (
            <div className="summary" style={{ marginTop: 24, marginBottom: 0 }}>
              <div className="summary__row">
                <span>অবস্থা</span>
                <span
                  style={{
                    color: booking.status === 'cancelled' ? 'var(--terracotta)' : '#157a43',
                  }}
                >
                  {booking.status === 'cancelled' ? 'বাতিল হয়েছে' : 'সক্রিয়'}
                </span>
              </div>
              <div className="summary__row">
                <span>রুমের ধরন</span>
                <span>{booking.roomName}</span>
              </div>
              <div className="summary__row">
                <span>তারিখ</span>
                <span>
                  {humanDate(booking.checkIn)} → {humanDate(booking.checkOut)}
                </span>
              </div>
              <div className="summary__row">
                <span>অতিথি</span>
                <span>
                  {booking.guest.name} · {formatNumber(booking.guest.guests)} জন
                </span>
              </div>
              <div className="summary__row summary__row--total">
                <span>মোট</span>
                <span>{formatPrice(booking.price.total)}</span>
              </div>

              {booking.status !== 'cancelled' ? (
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: '1px solid rgba(15,46,42,0.12)',
                  }}
                >
                  <a
                    href={buildAmendWhatsAppLink(booking)}
                    className="btn btn--whatsapp btn--sm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconWhatsApp size={16} />
                    বুকিং পরিবর্তন করুন
                  </a>
                  <a href={`tel:${HOTEL.phoneRaw}`} className="btn btn--call btn--sm">
                    <IconPhone size={16} />
                    আমাদের কল করুন
                  </a>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={handleCancel}
                  >
                    বুকিং বাতিল করুন
                  </button>
                </div>
              ) : (
                <p
                  style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: '1px solid rgba(15,46,42,0.12)',
                    fontSize: 14,
                    color: 'var(--ink-soft)',
                  }}
                >
                  এই বুকিংটি বাতিল হয়ে গেছে। আবার বুক করতে চাইলে {HOTEL.phoneDisplay} নম্বরে কল করুন।
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
