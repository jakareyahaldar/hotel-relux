import { HOTEL } from '../data/hotel.js';
import { EXTRA_SERVICES } from '../data/rooms.js';
import { formatPrice } from '../utils/pricing.js';
import { humanDate } from '../utils/dates.js';
import { formatNumber } from '../utils/format.js';

/** Step 1 of the booking flow - the guest details and extras form. */
export default function BookingForm({
  room,
  price,
  form,
  errors,
  extras,
  submitError,
  checkIn,
  checkOut,
  onUpdate,
  onToggleExtra,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="modal__body">
        <div className="summary">
          <div className="summary__row">
            <span>রুমের ধরন</span>
            <span>{room.name}</span>
          </div>
          <div className="summary__row">
            <span>তারিখ</span>
            <span>
              {humanDate(checkIn)} → {humanDate(checkOut)} · {formatNumber(price.nights)} রাত
            </span>
          </div>
          <div className="summary__row">
            <span>রুমের ভাড়া</span>
            <span>{formatPrice(price.roomSubtotal)}</span>
          </div>
          {price.extras.length > 0 && (
            <div className="summary__row">
              <span>সহায়ক সেবা</span>
              <span>{formatPrice(price.extrasTotal)}</span>
            </div>
          )}
          <div className="summary__row">
            <span>{HOTEL.taxLabel}</span>
            <span>{formatPrice(price.taxes)}</span>
          </div>
          <div className="summary__row summary__row--total">
            <span>মোট</span>
            <span>{formatPrice(price.total)}</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor="guest-name">
              পুরো নাম <span className="req">*</span>
            </label>
            <input
              id="guest-name"
              name="name"
              type="text"
              className="field__input"
              placeholder="যেমন: রুবাইয়াত হক"
              value={form.name}
              onChange={onUpdate('name')}
              aria-invalid={Boolean(errors.name)}
              autoComplete="name"
            />
            {errors.name && <span className="field__error">{errors.name}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="guest-phone">
              ফোন নম্বর <span className="req">*</span>
            </label>
            <input
              id="guest-phone"
              name="phone"
              type="tel"
              className="field__input"
              placeholder="01711-XXXXXX"
              value={form.phone}
              onChange={onUpdate('phone')}
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
            />
            {errors.phone && <span className="field__error">{errors.phone}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="guest-email">
              ইমেইল{' '}
              <span className="req" style={{ color: 'var(--ink-muted)' }}>
                (ঐচ্ছিক)
              </span>
            </label>
            <input
              id="guest-email"
              name="email"
              type="email"
              className="field__input"
              placeholder="you@example.com"
              value={form.email}
              onChange={onUpdate('email')}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
            />
            {errors.email && <span className="field__error">{errors.email}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="guest-count">
              অতিথি
            </label>
            <select
              id="guest-count"
              name="guests"
              className="field__select"
              value={form.guests}
              onChange={onUpdate('guests')}
            >
              {Array.from({ length: room.capacity }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {formatNumber(count)} জন
                </option>
              ))}
            </select>
            {errors.guests && <span className="field__error">{errors.guests}</span>}
          </div>

          <div className="field span-2">
            <label className="field__label" htmlFor="guest-requests">
              বিশেষ অনুরোধ
            </label>
            <textarea
              id="guest-requests"
              name="specialRequests"
              className="field__textarea"
              placeholder="দেরিতে আগমন, উপরের তলা, অতিরিক্ত বালিশ, খাদ্যসংক্রান্ত নোট..."
              value={form.specialRequests}
              onChange={onUpdate('specialRequests')}
            />
          </div>
        </div>


        <h4
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 19,
            color: 'var(--forest)',
            margin: '28px 0 14px',
          }}
        >
          সহায়ক সেবা যোগ করুন
        </h4>

        <div className="extras-list">
          {EXTRA_SERVICES.map((service) => {
            const checked = extras.includes(service.id);
            return (
              <label key={service.id} className={`extra-option ${checked ? 'extra-option--checked' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => onToggleExtra(service.id)} />
                <span className="extra-option__label">
                  {service.label}
                  <span className="extra-option__note">{service.note}</span>
                </span>
                <span className="extra-option__price">{formatPrice(service.price)}</span>
              </label>
            );
          })}
        </div>

        {submitError && (
          <div
            style={{
              marginTop: 20,
              padding: '13px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(181, 85, 58, 0.1)',
              color: 'var(--terracotta)',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {submitError}
          </div>
        )}
      </div>

      <div className="modal__foot">
        <button type="submit" className="btn btn--primary btn--lg btn--block">
          বুকিং নিশ্চিত করুন · {formatPrice(price.total)}
        </button>
        <p className="modal__foot-note">
          এখন কোনো টাকা লাগবে না। আমরা রুমটি সংরক্ষণ রাখি এবং হোয়াটসঅ্যাপ বা ফোনে নিশ্চিত করি।
        </p>
      </div>
    </form>
  );
}
