import { HOTEL } from '../data/hotel.js';
import { toBnDigits } from '../utils/format.js';
import { IconMail, IconPhone, IconPin, IconWhatsApp } from './icons.jsx';

export default function Footer({ onBook }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand-name">{HOTEL.name}</div>
            <p className="footer__text">
              {HOTEL.description} পরিবার পরিচালিত একটি ছোট আবাসিক হোটেল — বছরের সব দিন খোলা।
            </p>
            <button type="button" className="btn btn--gold" onClick={onBook}>
              আপনার রুম বুক করুন
            </button>
          </div>

          <div>
            <h4 className="footer__title">ঘুরে দেখুন</h4>
            <div className="footer__links">
              <a href="#rooms">রুম ও সুইট</a>
              <a href="#gallery">গ্যালারি</a>
              <a href="#amenities">সুবিধা</a>
              <a href="#reviews">অতিথিদের মতামত</a>
              <a href="#faq">প্রশ্নোত্তর</a>
              <a href="#contact">যোগাযোগ</a>
            </div>
          </div>

          <div>
            <h4 className="footer__title">রুমের ধরন</h4>
            <div className="footer__links">
              <a href="#rooms">ক্লাসিক রুম</a>
              <a href="#rooms">ডিলাক্স রুম</a>
              <a href="#rooms">রিল্যাক্স সুইট</a>
              <a href="#booking">রুম বুক করুন</a>
            </div>
          </div>

          <div>
            <h4 className="footer__title">যোগাযোগ</h4>
            <div className="footer__contact">
              <div className="footer__contact-item">
                <IconPhone size={17} />
                <a href={`tel:${HOTEL.phoneRaw}`}>{HOTEL.phoneDisplay}</a>
              </div>
              <div className="footer__contact-item">
                <IconWhatsApp size={17} />
                <a
                  href={`https://wa.me/${HOTEL.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  হোয়াটসঅ্যাপে লিখুন
                </a>
              </div>
              <div className="footer__contact-item">
                <IconMail size={17} />
                <a href={`mailto:${HOTEL.email}`}>{HOTEL.email}</a>
              </div>
              <div className="footer__contact-item">
                <IconPin size={17} />
                <span>
                  {HOTEL.address.line1}, {HOTEL.address.line2}
                  <br />
                  {HOTEL.address.city} {HOTEL.address.postalCode}, {HOTEL.address.state}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {toBnDigits(year)} {HOTEL.name}। সর্বস্বত্ব সংরক্ষিত।
          </span>
          <span>
            চেক-ইন {HOTEL.checkInTime} · চেক-আউট {HOTEL.checkOutTime} · {HOTEL.taxLabel}
          </span>
        </div>
      </div>
    </footer>
  );
}

