import { HOTEL } from '../data/hotel.js';
import { formatPrice } from '../utils/pricing.js';
import { humanDate } from '../utils/dates.js';
import { formatNumber } from '../utils/format.js';
import { IconCheck, IconPhone, IconWhatsApp } from './icons.jsx';

/**
 * Step 2 of the booking flow - the confirmation screen.
 * This is where the guest confirms over WhatsApp or by phone.
 * The exact room is allocated by the front desk, so no room number or
 * room details are shown here - only what the guest asked for.
 */
export default function BookingConfirmation({
  booking,
  message,
  checkIn,
  checkOut,
  onClose,
}) {
  return (
    <>
      <div className="modal__body">
        <div className="success">
          <div className="success__icon">
            <IconCheck size={36} />
          </div>
          <h4 className="success__title">আপনার রুম সংরক্ষিত হয়ে আছে</h4>
          <p className="success__text">
            {humanDate(checkIn)} থেকে {humanDate(checkOut)} পর্যন্ত আপনার অনুরোধ আমরা লিপিবদ্ধ
            করেছি। নিশ্চিত করতে হোয়াটসঅ্যাপে পাঠান বা কল করুন — বার্তাটি আগে থেকেই লেখা আছে,
            ফ্রন্ট ডেস্ক চব্বিশ ঘণ্টা সচল।
          </p>

          <div className="reference">
            <span className="reference__label">বুকিং রেফারেন্স</span>
            <span className="reference__value">{booking.reference}</span>
          </div>

          <div className="confirm-actions">
            <a
              href={booking.whatsappLink}
              className="btn btn--whatsapp btn--lg"
              target="_blank"
              rel="noreferrer"
            >
              <IconWhatsApp size={19} />
              হোয়াটসঅ্যাপে নিশ্চিত করুন
            </a>
            <a href={`tel:${HOTEL.phoneRaw}`} className="btn btn--call btn--lg">
              <IconPhone size={18} />
              হোটেলে কল করুন
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
    </>
  );
}
