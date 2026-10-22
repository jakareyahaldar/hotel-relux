import { HOTEL } from '../data/hotel.js';
import { EXTRA_SERVICES, getRoomById } from '../data/rooms.js';
import { humanDate, nightsBetween } from './dates.js';
import { formatNumber } from './format.js';

/**
 * Price breakdown for a stay.
 * Extras flagged `perNight` are charged for each night, others are one-off.
 */
export function calculatePrice({ roomId, checkIn, checkOut, extras = [] }) {
  const room = getRoomById(roomId);
  if (!room) throw new Error('Unknown room');

  const nights = Math.max(1, nightsBetween(checkIn, checkOut));
  const roomSubtotal = room.basePrice * nights;

  const validExtraIds = new Set(EXTRA_SERVICES.map((service) => service.id));
  const selectedExtras = EXTRA_SERVICES.filter(
    (service) => extras.includes(service.id) && validExtraIds.has(service.id),
  ).map((service) => ({
    id: service.id,
    label: service.label,
    price: service.price,
    perNight: service.perNight,
    total: service.perNight ? service.price * nights : service.price,
  }));

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.total, 0);
  const subtotal = roomSubtotal + extrasTotal;
  const taxes = Math.round(subtotal * HOTEL.taxRate);
  const total = subtotal + taxes;

  return {
    nights,
    roomSubtotal,
    extras: selectedExtras,
    extrasTotal,
    subtotal,
    taxes,
    taxRate: HOTEL.taxRate,
    total,
    currency: HOTEL.currency,
    currencySymbol: HOTEL.currencySymbol,
  };
}

/**
 * Compose the WhatsApp message body for a booking.
 *
 * The guest never sees a room number - only the room type they asked for, so
 * the front desk allocates the physical room at check-in.
 *
 * @param {object} booking  A booking record.
 * @param {'confirm'|'amend'} intent  What the guest wants the hotel to do.
 */
export function buildBookingMessage(booking, intent = 'confirm') {
  const room = getRoomById(booking.roomId);
  const isAmend = intent === 'amend';

  const lines = [
    isAmend
      ? `আসসালামু আলাইকুম ${HOTEL.shortName}, ${booking.reference} রেফারেন্সের বুকিংটি পরিবর্তন করতে চাই।`
      : `আসসালামু আলাইকুম ${HOTEL.shortName}, আমি একটি বুকিং নিশ্চিত করতে চাই।`,
    '',
    `বুকিং রেফারেন্স: ${booking.reference}`,
    `রুমের ধরন: ${room?.name || booking.roomName}`,
    `চেক-ইন: ${humanDate(booking.checkIn)}, ${HOTEL.checkInTime} থেকে`,
    `চেক-আউট: ${humanDate(booking.checkOut)}, ${HOTEL.checkOutTime} পর্যন্ত`,
    `রাত সংখ্যা: ${formatNumber(booking.price.nights)}`,
  ];

  if (booking.price.extras.length > 0) {
    lines.push('সহায়ক সেবা:');
    booking.price.extras.forEach((extra) => lines.push(`- ${extra.label}`));
  }

  lines.push(
    `অতিথি: ${booking.guest.name} (${formatNumber(booking.guest.guests)} জন)`,
    `ফোন: ${booking.guest.phone}`,
  );

  if (booking.specialRequests) {
    lines.push(`বিশেষ অনুরোধ: ${booking.specialRequests}`);
  }

  lines.push(
    `মোট: ${formatPrice(booking.price.total)}`,
    '',
    isAmend
      ? 'পরিবর্তনের খবরটি জানাবেন। ধন্যবাদ!'
      : 'আমার বুকিংটি নিশ্চিত করবেন। ধন্যবাদ!',
  );

  return lines.join('\n');
}

/** Compose the WhatsApp confirmation message body. */
export function buildWhatsAppMessage(booking) {
  return buildBookingMessage(booking, 'confirm');
}

/** Compose the WhatsApp message used when a guest wants to amend a booking. */
export function buildAmendWhatsAppMessage(booking) {
  return buildBookingMessage(booking, 'amend');
}

/**
 * Build the `wa.me` deep link that opens WhatsApp with the message ready.
 * Works on both mobile and desktop with no API key required.
 * An optional pre-built message can be passed in to avoid rebuilding it.
 */
export function buildWhatsAppLink(booking, message) {
  const body = message || buildWhatsAppMessage(booking);
  const phone = HOTEL.whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
}

/** The `wa.me` deep link for amending an existing booking. */
export function buildAmendWhatsAppLink(booking, message) {
  const body = message || buildAmendWhatsAppMessage(booking);
  const phone = HOTEL.whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
}

/** A generic WhatsApp link for enquiries (no booking attached). */
export function buildGeneralWhatsAppLink(text = '') {
  const phone = HOTEL.whatsappNumber.replace(/\D/g, '');
  const message = text || `আসসালামু আলাইকুম ${HOTEL.shortName}, রুম বুকিং নিয়ে একটি প্রশ্ন আছে।`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** The tel: link used by every "call us" button. */
export function buildCallLink() {
  return `tel:${HOTEL.phoneRaw}`;
}

/** Format an amount as taka, e.g. 9800 -> ৳৯,৮০০ (bn-BD digits). */
export function formatPrice(amount, symbol = HOTEL.currencySymbol) {
  return `${symbol}${formatNumber(Number(amount) || 0)}`;
}
