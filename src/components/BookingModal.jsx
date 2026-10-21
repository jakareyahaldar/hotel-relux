import { useEffect, useMemo, useState } from 'react';
import { calculatePrice } from '../utils/pricing.js';
import { createBooking, presentBooking } from '../utils/bookingActions.js';
import { humanDate } from '../utils/dates.js';
import { formatNumber } from '../utils/format.js';
import { IconClose } from './icons.jsx';
import BookingForm from './BookingForm.jsx';
import BookingConfirmation from './BookingConfirmation.jsx';

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  guests: 1,
  specialRequests: '',
};

/**
 * The booking modal.
 *
 * Step 1 - collect the guest details and any extras.
 * Step 2 - show the confirmed booking with the WhatsApp and phone actions.
 */
export default function BookingModal({ room, checkIn, checkOut, guests = 1, onClose, onToast }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState(EMPTY_FORM);
  const [extras, setExtras] = useState([]);
  const [errors, setErrors] = useState({});
  const [booking, setBooking] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // The party size the guest picked in the booking bar, capped at what the
  // room can actually sleep.
  const requestedGuests = Math.max(1, Math.min(Number(guests) || 1, room?.capacity || 1));

  // Reset whenever a new room is opened.
  useEffect(() => {
    setStep('form');
    setForm({ ...EMPTY_FORM, guests: requestedGuests });
    setExtras([]);
    setErrors({});
    setBooking(null);
    setSubmitError('');
  }, [room?.id, requestedGuests]);

  // Lock the page behind the modal and support Escape to close.
  useEffect(() => {
    document.body.classList.add('no-scroll');
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.classList.remove('no-scroll');
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const price = useMemo(() => {
    if (!room) return null;
    return calculatePrice({ roomId: room.id, checkIn, checkOut, extras });
  }, [room, checkIn, checkOut, extras]);

  if (!room || !price) return null;

  const update = (field) => (event) => {
    const value = event.target.name === 'guests' ? Number(event.target.value) : event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const toggleExtra = (id) => {
    setExtras((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'অনুগ্রহ করে আপনার নাম লিখুন।';
    if (!form.phone.trim()) {
      next.phone = 'বুকিং নিশ্চিত করতে ফোন নম্বর দরকার।';
    } else if (form.phone.replace(/\D/g, '').length < 7) {
      next.phone = 'ফোন নম্বরটি খুব ছোট মনে হচ্ছে।';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'ইমেইল ঠিকানাটি একবার দেখে নিন।';
    }
    if (form.guests > room.capacity) {
      next.guests = `${room.name} সর্বোচ্চ ${formatNumber(room.capacity)} জন অতিথির জন্য উপযুক্ত।`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    try {
      const created = presentBooking(
        createBooking({
          roomId: room.id,
          checkIn,
          checkOut,
          guest: form,
          extras,
          specialRequests: form.specialRequests,
        }),
      );
      setBooking(created);
      setStep('confirmed');
      onToast?.(`বুকিং ${created.reference} তৈরি হয়েছে`);
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={step === 'form' ? 'রুম বুক করুন' : 'বুকিং নিশ্চিত হয়েছে'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal__head">
          <div>
            <h3 className="modal__title">
              {step === 'form' ? 'বুকিং সম্পন্ন করুন' : 'বুকিং নিশ্চিত হয়েছে'}
            </h3>
            <p className="modal__subtitle">
              {step === 'form'
                ? `${room.name} · ${humanDate(checkIn)} → ${humanDate(checkOut)}`
                : `রেফারেন্স ${booking?.reference}`}
            </p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="বন্ধ করুন">
            <IconClose />
          </button>
        </div>

        {step === 'form' ? (
          <BookingForm
            room={room}
            price={price}
            form={form}
            errors={errors}
            extras={extras}
            submitError={submitError}
            checkIn={checkIn}
            checkOut={checkOut}
            onUpdate={update}
            onToggleExtra={toggleExtra}
            onSubmit={handleSubmit}
          />
        ) : (
          <BookingConfirmation
            booking={booking}
            message={booking?.whatsappMessage}
            checkIn={checkIn}
            checkOut={checkOut}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
