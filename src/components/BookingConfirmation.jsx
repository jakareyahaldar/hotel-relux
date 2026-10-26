import { HOTEL } from '../data/hotel.js';
import { formatPrice } from '../utils/pricing.js';
import { humanDate } from '../utils/dates.js';
import { formatNumber } from '../utils/format.js';
import { IconCheck, IconClose, IconPhone, IconWhatsApp } from './icons.jsx';

export default function BookingConfirmation({
  booking,
  message,
  checkIn,
  checkOut,
  onClose,
}) {
  return (
    <div
      className="modal-backdrop confirm-method-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="বুকিং নিশ্চিত হয়েছে"
      onClick={onClose}
    >
      <div className="modal confirm-method-popup" onClick={(event) => event.stopPropagation()}>
        <div className="modal__head">
          <div>
            <h3 className="modal__title">বুকিং নিশ্চিত করুন</h3>
            <p className="modal__subtitle">নিশ্চিত করার পদ্ধতি বেছে নিন</p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="বন্ধ করুন">
            <IconClose />
          </button>
        </div>

        <div className="modal__body">
          <div className="success">
            <div className="success__icon">
              <IconCheck size={36} />
            </div>
            <h4 className="success__title">বুকিং নিশ্চিত করতে চান?</h4>
            <p className="success__text">
              আপনি যদি বুকিংটি নিশ্চিত করতে চান, তাহলে সরাসরি কল অথবা হোয়াটসঅ্যাপ বার্তার মাধ্যমে
              নিশ্চিত করুন।
            </p>

            <p className="confirm-note">
              কোন পদ্ধতিতে নিশ্চিত করবেন? সরাসরি কল করুন অথবা হোয়াটসঅ্যাপে বার্তা পাঠান।
            </p>

            <div className="confirm-actions">
              <a
                href={booking.callLink}
                className="btn btn--call btn--lg"
                onClick={onClose}
              >
                <IconPhone size={18} />
                সরাসরি কল
              </a>
              <a
                href={booking.whatsappLink}
                className="btn btn--whatsapp btn--lg"
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
              >
                <IconWhatsApp size={19} />
                হোয়াটসঅ্যাপ
              </a>
            </div>

            <p className="confirm-note">
              অনলাইনে আমরা কখনো রুম নম্বর দিই না — আপনি নিশ্চিত করার পর ফ্রন্ট ডেস্ক আপনার
              পছন্দের ক্যাটাগরিতে সেরা ফাঁকা রুমটি দেবে।
            </p>

            <div className="summary" style={{ textAlign: 'left', marginTop: 24, marginBottom: 0 }}>
              <div className="summary__row">
                <span>অতিথি</span>
                <span>
                  {booking.guest.name} · {formatNumber(booking.guest.guests)} জন
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
              {booking.price.extras.length > 0 && (
                <div className="summary__row">
                  <span>সহায়ক সেবা</span>
                  <span>{booking.price.extras.map((extra) => extra.label).join(', ')}</span>
                </div>
              )}
              {booking.specialRequests && (
                <div className="summary__row">
                  <span>অনুরোধ</span>
                  <span>{booking.specialRequests}</span>
                </div>
              )}
              <div className="summary__row summary__row--total">
                <span>চেক-ইনের সময় পরিশোধযোগ্য মোট</span>
                <span>{formatPrice(booking.price.total)}</span>
              </div>
            </div>

            {message && (
              <div className="confirm-message">
                <span className="confirm-message__label">আমরা যে বার্তা পাঠাব</span>
                <pre className="confirm-message__body">{message}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="modal__foot">
          <p className="modal__foot-note">
            ফ্রন্ট ডেস্ক আপনার সাথে যোগাযোগ করবে — উপরের বাটন দিয়ে নিশ্চিত করুন।
          </p>
        </div>
      </div>
    </div>
  );
}
