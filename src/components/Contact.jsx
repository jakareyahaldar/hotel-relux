import { HOTEL } from '../data/hotel.js';
import { buildGeneralWhatsAppLink } from '../utils/pricing.js';
import {
  IconArrowRight,
  IconClock,
  IconMail,
  IconPhone,
  IconPin,
  IconWhatsApp,
} from './icons.jsx';

export default function Contact({ onBook }) {
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3678.087395867532!2d89.5283513!3d22.7992253!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ff850036869c67%3A0xc647617ff61851d8!2z4Ka54KeL4Kaf4KeH4KayIOCmsOCmv-CmsuCnjeCmr-CmvuCmleCnjeCmuCDgpobgpqzgpr7gprjgpr_gppU!5e0!3m2!1sen!2sbd!4v1792680700853!5m2!1sen!2sbd`;

  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">আমাদের খুঁজে নিন</span>
          <h2 className="section__title">এসে আমাদের সাথে থাকুন</h2>
          <p className="section__lead">
            আমরা যশোর রোডে, বিসমিল্লাহ সুপার মার্কেটের পাশে — জিরো পয়েন্ট থেকে মাত্র ৩০০ গজ
            উত্তরে। ফ্রন্ট ডেস্কে কল করুন, হোয়াটসঅ্যাপে লিখুন, অথবা চা খেতে এসে যান।
          </p>
        </div>

        <div className="contact">
          <div className="contact__cards">
            <div className="contact-card">
              <div className="contact-card__icon contact-card__icon--whatsapp">
                <IconWhatsApp size={22} />
              </div>
              <div>
                <div className="contact-card__label">হোয়াটসঅ্যাপ</div>
                <div className="contact-card__value">{HOTEL.phoneDisplay}</div>
                <div className="contact-card__note">
                  বুক করার দ্রুততম উপায়। সাধারণত কয়েক মিনিটের মধ্যে উত্তর দিই।
                </div>
                <a
                  href={buildGeneralWhatsAppLink()}
                  className="contact-card__link"
                  target="_blank"
                  rel="noreferrer"
                >
                  বার্তা পাঠান <IconArrowRight size={14} />
                </a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card__icon contact-card__icon--phone">
                <IconPhone size={21} />
              </div>
              <div>
                <div className="contact-card__label">টেলিফোন</div>
                <div className="contact-card__value">{HOTEL.phoneDisplay}</div>
                <div className="contact-card__note">চব্বিশ ঘণ্টা ফ্রন্ট ডেস্ক খোলা।</div>
                <a href={`tel:${HOTEL.phoneRaw}`} className="contact-card__link">
                  এখনই কল করুন <IconArrowRight size={14} />
                </a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card__icon contact-card__icon--email">
                <IconMail size={21} />
              </div>
              <div>
                <div className="contact-card__label">ইমেইল</div>
                <div className="contact-card__value">{HOTEL.email}</div>
                <div className="contact-card__note">এক কর্মদিবসের মধ্যে উত্তর দিই।</div>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card__icon contact-card__icon--pin">
                <IconPin size={21} />
              </div>
              <div>
                <div className="contact-card__label">ঠিকানা</div>
                <div className="contact-card__value">{HOTEL.address.line1}</div>
                <div className="contact-card__note">
                  {HOTEL.address.line2}
                  <br />
                  {HOTEL.address.city} {HOTEL.address.postalCode}, {HOTEL.address.state},{' '}
                  {HOTEL.address.country}
                </div>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card__icon contact-card__icon--phone">
                <IconClock size={21} />
              </div>
              <div>
                <div className="contact-card__label">চেক-ইন ও চেক-আউট</div>
                <div className="contact-card__value">
                  {HOTEL.checkInTime} / {HOTEL.checkOutTime}
                </div>
                <div className="contact-card__note">আগে আসা ও দেরিতে যাওয়া চাইলে জানান।</div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--lg"
              style={{ marginTop: 8 }}
              onClick={onBook}
            >
              রুম দেখে বুক করুন
            </button>
          </div>

          <div className="map">
            <iframe
              title={`${HOTEL.name} অবস্থানের মানচিত্র`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
