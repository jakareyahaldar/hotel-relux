import { HOTEL } from '../data/hotel.js';
import { getRoomById } from '../data/rooms.js';
import { nightsBetween, today } from './dates.js';
import { formatNumber } from './format.js';
import { buildWhatsAppLink, buildWhatsAppMessage, calculatePrice } from './pricing.js';
import { occupiedRoomIds, readBookings, writeBookings } from './booking.js';

/**
 * Create a booking. Validates the guest details and re-checks availability
 * before writing, so a room cannot be double-booked.
 */
export function createBooking(payload) {
  const {
    roomId,
    checkIn,
    checkOut,
    guest = {},
    extras = [],
    specialRequests = '',
  } = payload;

  if (!roomId) throw new Error('অনুগ্রহ করে একটি রুম নির্বাচন করুন।');
  const room = getRoomById(roomId);
  if (!room) throw new Error('এই রুমটি পাওয়া যায়নি।');

  if (!checkIn || !checkOut) throw new Error('চেক-ইন ও চেক-আউটের তারিখ দিতে হবে।');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new Error('চেক-আউটের তারিখ চেক-ইনের পরে হতে হবে।');
  if (checkIn < today()) throw new Error('চেক-ইনের তারিখ অতীতে হতে পারে না।');

  if (!guest.name || !guest.name.trim()) throw new Error('অনুগ্রহ করে আপনার নাম লিখুন।');
  if (!guest.phone || !guest.phone.trim()) throw new Error('অনুগ্রহ করে আপনার ফোন নম্বর লিখুন।');

  const phoneDigits = String(guest.phone).replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw new Error('অনুগ্রহ করে একটি সঠিক ফোন নম্বর লিখুন।');
  }
  if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
    throw new Error('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।');
  }

  const guests = Number(guest.guests || 1);
  if (!Number.isFinite(guests) || guests < 1) throw new Error('অন্তত একজন অতিথি লাগবে।');
  if (guests > room.capacity) {
    throw new Error(`${room.name} সর্বোচ্চ ${formatNumber(room.capacity)} জন অতিথির জন্য উপযুক্ত।`);
  }

  const price = calculatePrice({ roomId, checkIn, checkOut, extras });

  // Availability re-check (double booking protection).
  if (occupiedRoomIds(checkIn, checkOut).has(roomId)) {
    const error = new Error('দুঃখিত, এই তারিখে রুমটি ইতিমধ্যে বুক হয়ে গেছে। অন্য একটি রুম বেছে নিন।');
    error.status = 409;
    throw error;
  }

  const booking = {
    status: 'pending',
    roomId,
    roomNumber: room.number,
    roomName: room.name,
    roomType: room.type,
    roomView: room.view,
    checkIn,
    checkOut,
    nights: price.nights,
    guest: {
      name: guest.name.trim(),
      phone: guest.phone.trim(),
      email: (guest.email || '').trim(),
      guests,
    },
    extras: price.extras.map((extra) => extra.id),
    specialRequests: String(specialRequests || '').trim(),
    price,
    createdAt: new Date().toISOString(),
  };

  const bookings = readBookings();
  bookings.push(booking);
  writeBookings(bookings);

  return booking;
}

/** Public-safe view of a booking, including the WhatsApp and call links. */
export function presentBooking(booking) {
  if (!booking) return null;
  const whatsappMessage = buildWhatsAppMessage(booking);
  return {
    ...booking,
    whatsappMessage,
    whatsappLink: buildWhatsAppLink(booking, whatsappMessage),
    callLink: `tel:${HOTEL.phoneRaw}`,
  };
}

/** All bookings for a given phone number. */
export function findBookingsByPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return readBookings().filter(
    (booking) => String(booking.guest?.phone || '').replace(/\D/g, '') === digits,
  );
}
