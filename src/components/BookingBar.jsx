import { HOTEL } from '../data/hotel.js';
import { TOTAL_ROOMS } from '../data/rooms.js';
import { getAvailabilitySummary } from '../utils/booking.js';
import { addDays, humanDate, today } from '../utils/dates.js';
import { formatNumber } from '../utils/format.js';

const TYPE_LABELS = {
  ac: 'এসি',
  nonac: 'নন-এসি',
};

/**
 * The sticky booking bar. Shows live availability for the chosen dates and
 * scrolls the guest to the rooms list when they search.
 */
export default function BookingBar({
  checkIn,
  checkOut,
  guests,
  roomType,
  onChange,
  onSearch,
  onBook,
}) {
  const summary = getAvailabilitySummary(checkIn, checkOut);
  const hasValidDates = summary.nights >= 1;

  return (
    <section className="bookbar" id="booking">
      <div className="container">
        <div className="bookbar__card">
          <h2 className="bookbar__title">আপনার থাকা বুক করুন</h2>

          <div className="bookbar__grid">
            <div className="field">
              <label className="field__label" htmlFor="bar-checkin">
                চেক-ইন
              </label>
              <input
                id="bar-checkin"
                type="date"
                className="field__input"
                value={checkIn}
                min={today()}
                onChange={(event) => onChange({ checkIn: event.target.value, checkOut })}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="bar-checkout">
                চেক-আউট
              </label>
              <input
                id="bar-checkout"
                type="date"
                className="field__input"
                value={checkOut}
                min={checkIn || today()}
                onChange={(event) => onChange({ checkIn, checkOut: event.target.value })}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="bar-guests">
                অতিথি
              </label>
              <select
                id="bar-guests"
                className="field__select"
                value={guests}
                onChange={(event) => onChange({ guests: Number(event.target.value) })}
              >
                {[1, 2, 3, 4].map((count) => (
                  <option key={count} value={count}>
                    {formatNumber(count)} জন
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="bar-room">
                রুমের ধরন
              </label>
              <select
                id="bar-room"
                className="field__select"
                value={roomType}
                onChange={(event) => onChange({ roomType: event.target.value })}
              >
                <option value="all">যেকোনো রুম</option>
                <option value="ac">এসি রুম</option>
                <option value="nonac">নন-এসি রুম</option>
              </select>
            </div>

            <button type="button" className="btn btn--primary" onClick={onSearch}>
              খুঁজুন
            </button>
          </div>

          {hasValidDates ? (
            <div className="bookbar__availability">
              <span className="pill pill--free">
                <span className="pill__dot" />
                {formatNumber(summary.availableRooms)} / {formatNumber(TOTAL_ROOMS)} রুম ফাঁকা
              </span>
              <span className="pill">
                {formatNumber(summary.nights)} রাত · {humanDate(checkIn)} → {humanDate(checkOut)}
              </span>
              {summary.byType.map((type) => (
                <span key={type.type} className="pill">
                  {TYPE_LABELS[type.type]}: {formatNumber(type.available)}/{formatNumber(type.total)}
                </span>
              ))}
              {summary.availableRooms === 0 && (
                <span className="pill pill--full">
                  <span className="pill__dot" />
                  এই তারিখে সম্পূর্ণ বুকড
                </span>
              )}
            </div>
          ) : (
            <div className="bookbar__availability">
              <span className="pill">খালি রুম দেখতে চেক-আউটের তারিখ দিন</span>
            </div>
          )}

          <div className="bookbar__availability" style={{ borderTop: 'none', paddingTop: 4 }}>
            <span>
              চেক-ইন {HOTEL.checkInTime} থেকে · চেক-আউট {HOTEL.checkOutTime} পর্যন্ত
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ marginLeft: 'auto' }}
              onClick={onBook}
            >
              এখনই বুক করুন
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

