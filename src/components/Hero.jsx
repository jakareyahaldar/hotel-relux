import { HOTEL } from '../data/hotel.js';
import { TOTAL_ROOMS } from '../data/rooms.js';
import { formatNumber } from '../utils/format.js';
import { IconArrowRight, IconPhone, IconWhatsApp } from './icons.jsx';

export default function Hero({ onBook, onCall, onWhatsApp }) {
  return (
    <section className="hero" id="top">
      <div className="hero__bg" />
      <div className="hero__overlay" />

      <div className="container">
        <div className="hero__content">
          <span className="hero__badge">
            <span className="pill__dot" />
            {HOTEL.founded} · যশোর রোড, খুলনা
          </span>

          <h1 className="hero__title">
            তেরোটি রুম,
            <br />
            <em>নিশ্চিন্ত</em> আবাসের ঠিকানা।
          </h1>

          <p className="hero__text">{HOTEL.description}</p>

          <div className="hero__actions">
            <button type="button" className="btn btn--gold btn--lg" onClick={onBook}>
              রুমের খোঁজ দেখুন
              <IconArrowRight />
            </button>
            <a
              href={`https://wa.me/${HOTEL.whatsappNumber}`}
              className="btn btn--whatsapp btn--lg"
              target="_blank"
              rel="noreferrer"
              onClick={onWhatsApp}
            >
              <IconWhatsApp size={19} />
              হোয়াটসঅ্যাপে লিখুন
            </a>
            <a href={`tel:${HOTEL.phoneRaw}`} className="btn btn--call btn--lg" onClick={onCall}>
              <IconPhone size={18} />
              হোটেলে কল করুন
            </a>
          </div>

          <div className="hero__stats">
            <div>
              <div className="hero__stat-value">{formatNumber(TOTAL_ROOMS)}</div>
              <div className="hero__stat-label">রুম ও সুইট</div>
            </div>
            <div>
              <div className="hero__stat-value">৪.৯</div>
              <div className="hero__stat-label">অতিথির রেটিং</div>
            </div>
            <div>
              <div className="hero__stat-value">২৪/৭</div>
              <div className="hero__stat-label">ফ্রন্ট ডেস্ক</div>
            </div>
            <div>
              <div className="hero__stat-value">৩০০ গজ</div>
              <div className="hero__stat-label">শূন্য পয়েন্ট থেকে</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

