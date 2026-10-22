import { useEffect, useMemo, useState } from 'react';
import { calculatePrice } from '../utils/pricing.js';
import { createBooking, presentBooking } from '../utils/bookingActions.js';
import { addDays, humanDate, nightsBetween } from '../utils/dates.js';
import { formatNumber } from '../utils/format.js';
import { getAvailability } from '../utils/booking.js';
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

export default function BookingModal({ room, checkIn, checkOut, guests = 1, onClose, onToast }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState(EMPTY_FORM);
  const [extras, setExtras] = useState([]);
  const [errors, setErrors] = useState({});
  const [booking, setBooking] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(room?.id);
  const [stayNights, setStayNights] = useState(Math.max(1, nightsBetween(checkIn, checkOut) || 1));

  useEffect(() => {
    setStayNights(Math.max(1, nightsBetween(checkIn, checkOut) || 1));
  }, [checkIn, checkOut]);

  const effectiveCheckOut = addDays(checkIn, Math.max(1, stayNights || 1));

  const availableRooms = useMemo(() => {
    const free = getAvailability(checkIn, effectiveCheckOut).filter((item) => item.available);
    if (free.length === 0) return room ? [room] : [];
    return free;
  }, [checkIn, effectiveCheckOut, room]);

  useEffect(() => {
    if (!availableRooms.some((item) => item.id === selectedRoomId)) {
      setSelectedRoomId(availableRooms[0]?.id ?? room?.id);
    }
  }, [availableRooms, selectedRoomId, room]);

  const selectedRoom = useMemo(
    () => availableRooms.find((item) => item.id === selectedRoomId) || room || availableRooms[0],
    [availableRooms, selectedRoomId, room],
  );



  useEffect(() => {
    const initialGuests = Math.max(1, Math.min(Number(guests) || 1, room?.capacity || 1));
    setStep('form');
    setForm({ ...EMPTY_FORM, guests: initialGuests });
    setExtras([]);
    setErrors({});
    setBooking(null);
    setSubmitError('');
    setSelectedRoomId(availableRooms.some((item) => item.id === room?.id) ? room?.id : (availableRooms[0]?.id ?? room?.id));
  }, [room?.id, guests]);

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
    if (!selectedRoom) return null;
    return calculatePrice({ roomId: selectedRoom.id, checkIn, checkOut: effectiveCheckOut, extras });
  }, [selectedRoom, checkIn, effectiveCheckOut, extras]);

  if (!selectedRoom || !price) return null;

  const update = (field) => (event) => {
    const value = event.target.name === 'guests' ? Number(event.target.value) : event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleRoomChange = (roomId) => {
    const nextRoom = availableRooms.find((item) => item.id === roomId) || room;
    setSelectedRoomId(roomId);
    setForm((previous) => ({
      ...previous,
      guests: Math.max(1, Math.min(Number(previous.guests) || 1, nextRoom?.capacity || 1)),
    }));
    setErrors((previous) => ({ ...previous, guests: undefined }));
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
    if (form.guests > selectedRoom.capacity) {
      next.guests = `${selectedRoom.name} সর্বোচ্চ ${formatNumber(selectedRoom.capacity)} জন অতিথির জন্য উপযুক্ত।`;
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
          roomId: selectedRoom.id,
          checkIn,
          checkOut: effectiveCheckOut,
          guest: form,
          extras,
          specialRequests: form.specialRequests,
        }),
      );
      setBooking(created);
      setStep('confirmed');
      onToast?.('বুকিং তৈরি হয়েছে');
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
                ? `${selectedRoom.name} · ${humanDate(checkIn)} → ${humanDate(effectiveCheckOut)}`
                : 'বুকিং নিশ্চিত হয়েছে'}
            </p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="বন্ধ করুন">
            <IconClose />
          </button>
        </div>

        {step === 'form' ? (
          <BookingForm
            room={selectedRoom}
            rooms={availableRooms}
            price={price}
            form={form}
            errors={errors}
            extras={extras}
            submitError={submitError}
            checkIn={checkIn}
            checkOut={effectiveCheckOut}
            nights={stayNights}
            onNightsChange={setStayNights}
            onUpdate={update}
            onRoomChange={handleRoomChange}
            onToggleExtra={toggleExtra}
            onSubmit={handleSubmit}
          />
        ) : (
          <BookingConfirmation
            booking={booking}
            message={booking?.whatsappMessage}
            checkIn={checkIn}
            checkOut={effectiveCheckOut}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
