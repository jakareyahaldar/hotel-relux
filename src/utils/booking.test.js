/**
 * Logic tests for the booking engine.
 * Run with:  npm test
 *
 * The browser APIs (localStorage, crypto) are stubbed so the pure logic can
 * be exercised in Node without a testing framework dependency.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

/* ------------------------------------------------------------------ */
/* Minimal browser stubs                                              */
/* ------------------------------------------------------------------ */

const store = new Map();

globalThis.window = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  },
};

if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i += 1) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
  };
}

const { parseDate, formatDate, addDays, nightsBetween, dateRange } = await import('./dates.js');
const { getAvailability, getAvailabilitySummary, getBookableRooms, matchesGuestCriteria } =
  await import('./booking.js');
const {
  calculatePrice,
  buildWhatsAppMessage,
  buildWhatsAppLink,
  buildAmendWhatsAppMessage,
  buildAmendWhatsAppLink,
} = await import('./pricing.js');
const { createBooking, getBooking, cancelBooking } = await import('./bookingActions.js');

const clearStore = () => store.clear();

/* ------------------------------------------------------------------ */
/* Dates                                                              */
/* ------------------------------------------------------------------ */

test('nightsBetween counts the nights, not the days', () => {
  assert.equal(nightsBetween('2026-03-01', '2026-03-04'), 3);
  assert.equal(nightsBetween('2026-03-01', '2026-03-02'), 1);
});

test('dateRange excludes the checkout date', () => {
  assert.deepEqual(dateRange('2026-03-01', '2026-03-04'), [
    '2026-03-01',
    '2026-03-02',
    '2026-03-03',
  ]);
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2025-12-31', 1), '2026-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('parseDate and formatDate round-trip', () => {
  assert.equal(formatDate(parseDate('2026-07-04')), '2026-07-04');
});

/* ------------------------------------------------------------------ */
/* Availability                                                       */
/* ------------------------------------------------------------------ */

test('all 13 rooms are free for a fresh date range', () => {
  clearStore();
  const summary = getAvailabilitySummary('2030-01-10', '2030-01-12');
  assert.equal(summary.totalRooms, 13);
  assert.equal(summary.availableRooms, 13);
  assert.equal(summary.nights, 2);
});

test('booking a room marks it unavailable for overlapping nights', () => {
  clearStore();
  const before = getAvailability('2030-02-01', '2030-02-03');
  const target = before.find((room) => room.available);

  createBooking({
    roomId: target.id,
    checkIn: '2030-02-01',
    checkOut: '2030-02-03',
    guest: { name: 'Test Guest', phone: '9876543210', email: 'test@example.com', guests: 2 },
  });

  const after = getAvailability('2030-02-01', '2030-02-03');
  const updated = after.find((room) => room.id === target.id);
  assert.equal(updated.available, false);
  assert.equal(updated.unavailableReason, 'Booked for these dates');
});

test('checkout day is free again for a same-day turnover', () => {
  clearStore();
  const room = getAvailability('2030-03-01', '2030-03-02')[0];

  createBooking({
    roomId: room.id,
    checkIn: '2030-03-01',
    checkOut: '2030-03-02',
    guest: { name: 'Test Guest', phone: '9876543210', guests: 1 },
  });

  // A guest arriving on the checkout day must still be able to book.
  const next = getAvailability('2030-03-02', '2030-03-03');
  assert.equal(next.find((r) => r.id === room.id).available, true);
});

test('a booking on a non-overlapping date does not block the room', () => {
  clearStore();
  const room = getAvailability('2030-04-01', '2030-04-03')[0];

  createBooking({
    roomId: room.id,
    checkIn: '2030-04-01',
    checkOut: '2030-04-03',
    guest: { name: 'Test Guest', phone: '9876543210', guests: 1 },
  });

  const later = getAvailability('2030-04-03', '2030-04-05');
  assert.equal(later.find((r) => r.id === room.id).available, true);
});

/* ------------------------------------------------------------------ */
/* Guest capacity and room type filtering                             */
/* ------------------------------------------------------------------ */

test('matchesGuestCriteria rejects a room that is too small for the party', () => {
  clearStore();
  const [classic] = getAvailability('2030-10-01', '2030-10-03').filter(
    (room) => room.type === 'classic',
  );

  assert.equal(matchesGuestCriteria(classic, 1), true);
  assert.equal(matchesGuestCriteria(classic, 2), true);
  assert.equal(matchesGuestCriteria(classic, 3), false);
  assert.equal(matchesGuestCriteria(classic, 4), false);
});

test('matchesGuestCriteria only keeps the requested room type', () => {
  clearStore();
  const rooms = getAvailability('2030-10-01', '2030-10-03');

  const classic = rooms.find((room) => room.type === 'classic');
  const suite = rooms.find((room) => room.type === 'suite');

  assert.equal(matchesGuestCriteria(classic, 2, 'classic'), true);
  assert.equal(matchesGuestCriteria(classic, 2, 'deluxe'), false);
  assert.equal(matchesGuestCriteria(classic, 2, 'all'), true);
  assert.equal(matchesGuestCriteria(suite, 4, 'suite'), true);
  assert.equal(matchesGuestCriteria(suite, 4, 'classic'), false);
});

test('matchesGuestCriteria handles missing or nonsense input safely', () => {
  assert.equal(matchesGuestCriteria(null, 2), false);
  assert.equal(matchesGuestCriteria(undefined, 2, 'classic'), false);
  // A blank party size falls back to a single guest.
  assert.equal(matchesGuestCriteria({ capacity: 2, type: 'classic' }, 0), true);
  assert.equal(matchesGuestCriteria({ capacity: 2, type: 'classic' }, 'abc'), true);
});

test('getBookableRooms only returns free rooms that fit the party and type', () => {
  clearStore();
  const bookable = getBookableRooms('2030-11-01', '2030-11-03', { guests: 2, type: 'all' });

  // Every room sleeps at least two guests, so all thirteen are bookable.
  assert.equal(bookable.length, 13);
  assert.ok(bookable.every((room) => room.available));
  assert.ok(bookable.every((room) => room.capacity >= 2));

  // A party of three rules out the classic rooms (capacity 2).
  const forThree = getBookableRooms('2030-11-01', '2030-11-03', { guests: 3, type: 'all' });
  assert.equal(forThree.length, 8);
  assert.ok(forThree.every((room) => room.type !== 'classic'));
});

test('getBookableRooms narrows down as the party grows', () => {
  clearStore();
  const dates = ['2030-11-01', '2030-11-03'];

  assert.equal(getBookableRooms(...dates, { guests: 1, type: 'all' }).length, 13);
  assert.equal(getBookableRooms(...dates, { guests: 3, type: 'all' }).length, 8);
  assert.equal(getBookableRooms(...dates, { guests: 4, type: 'all' }).length, 3);
});

test('getBookableRooms honours the requested room type', () => {
  clearStore();
  const dates = ['2030-11-01', '2030-11-03'];

  const suites = getBookableRooms(...dates, { guests: 4, type: 'suite' });
  assert.equal(suites.length, 3);
  assert.ok(suites.every((room) => room.type === 'suite'));

  // No classic room sleeps four guests.
  assert.equal(getBookableRooms(...dates, { guests: 4, type: 'classic' }).length, 0);
  // No classic room is free once booked.
  assert.equal(getBookableRooms(...dates, { guests: 2, type: 'classic' }).length, 5);
});

test('getBookableRooms excludes a room that has already been booked', () => {
  clearStore();
  const dates = ['2030-12-01', '2030-12-03'];
  const target = getAvailability(...dates).find((room) => room.type === 'classic');

  createBooking({
    roomId: target.id,
    checkIn: dates[0],
    checkOut: dates[1],
    guest: { name: 'Test Guest', phone: '9876543210', guests: 2 },
  });

  const bookable = getBookableRooms(...dates, { guests: 2, type: 'classic' });
  assert.equal(bookable.length, 4);
  assert.ok(!bookable.some((room) => room.id === target.id));
});

test('getBookableRooms returns nothing for an invalid date range', () => {
  clearStore();
  assert.deepEqual(getBookableRooms('2030-11-05', '2030-11-01', { guests: 1 }), []);
  assert.deepEqual(getBookableRooms('', '', { guests: 1 }), []);
});

/* ------------------------------------------------------------------ */
/* Pricing                                                            */
/* ------------------------------------------------------------------ */

test('price includes nights, extras and GST', () => {
  const price = calculatePrice({
    roomId: 'r201',
    checkIn: '2030-05-01',
    checkOut: '2030-05-03',
    extras: ['breakfast', 'airport-pickup'],
  });

  // Deluxe = 5200 x 2 nights = 10400
  assert.equal(price.roomSubtotal, 10400);
  // Breakfast 450 x 2 nights = 900, pickup 700 one-off = 1600
  assert.equal(price.extrasTotal, 1600);
  assert.equal(price.subtotal, 12000);
  assert.equal(price.taxes, 1440);
  assert.equal(price.total, 13440);
});

test('price with no extras is just room plus GST', () => {
  const price = calculatePrice({
    roomId: 'r101',
    checkIn: '2030-05-01',
    checkOut: '2030-05-02',
    extras: [],
  });

  assert.equal(price.roomSubtotal, 3200);
  assert.equal(price.taxes, 384);
  assert.equal(price.total, 3584);
});

/* ------------------------------------------------------------------ */
/* Booking creation and validation                                    */
/* ------------------------------------------------------------------ */

test('createBooking returns a reference and persists the booking', () => {
  clearStore();
  const booking = createBooking({
    roomId: 'r301',
    checkIn: '2030-06-01',
    checkOut: '2030-06-04',
    guest: { name: 'Priya R', phone: '+91 98765 43210', email: 'priya@example.com', guests: 2 },
    extras: ['breakfast'],
  });

  assert.match(booking.reference, /^AUR-[A-Z0-9]{6}$/);
  assert.equal(booking.status, 'pending');
  assert.equal(booking.nights, 3);
  assert.equal(booking.guest.name, 'Priya R');

  const found = getBooking(booking.reference);
  assert.ok(found);
  assert.equal(found.roomNumber, '301');
});

test('createBooking rejects a missing name', () => {
  clearStore();
  assert.throws(
    () =>
      createBooking({
        roomId: 'r101',
        checkIn: '2030-06-01',
        checkOut: '2030-06-02',
        guest: { name: '  ', phone: '9876543210' },
      }),
    /enter your name/i,
  );
});

test('createBooking rejects an invalid email', () => {
  clearStore();
  assert.throws(
    () =>
      createBooking({
        roomId: 'r101',
        checkIn: '2030-06-01',
        checkOut: '2030-06-02',
        guest: { name: 'Test', phone: '9876543210', email: 'not-an-email' },
      }),
    /valid email/i,
  );
});

test('createBooking rejects more guests than the room sleeps', () => {
  clearStore();
  assert.throws(
    () =>
      createBooking({
        roomId: 'r101', // Classic - capacity 2
        checkIn: '2030-06-01',
        checkOut: '2030-06-02',
        guest: { name: 'Test', phone: '9876543210', guests: 4 },
      }),
    /sleeps up to 2/i,
  );
});

test('createBooking rejects a checkout before checkin', () => {
  clearStore();
  assert.throws(
    () =>
      createBooking({
        roomId: 'r101',
        checkIn: '2030-06-05',
        checkOut: '2030-06-02',
        guest: { name: 'Test', phone: '9876543210' },
      }),
    /after check-in/i,
  );
});

test('createBooking rejects a checkin in the past', () => {
  clearStore();
  assert.throws(
    () =>
      createBooking({
        roomId: 'r101',
        checkIn: '2020-01-01',
        checkOut: '2020-01-02',
        guest: { name: 'Test', phone: '9876543210' },
      }),
    /cannot be in the past/i,
  );
});

test('createBooking blocks a double booking of the same room and dates', () => {
  clearStore();
  const payload = {
    roomId: 'r205',
    checkIn: '2030-07-01',
    checkOut: '2030-07-03',
    guest: { name: 'Test', phone: '9876543210' },
  };

  createBooking(payload);
  assert.throws(() => createBooking(payload), /just booked/i);
});

test('cancelBooking frees the room again', () => {
  clearStore();
  const booking = createBooking({
    roomId: 'r105',
    checkIn: '2030-08-01',
    checkOut: '2030-08-03',
    guest: { name: 'Test', phone: '9876543210' },
  });

  const cancelled = cancelBooking(booking.reference);
  assert.equal(cancelled.status, 'cancelled');

  const availability = getAvailability('2030-08-01', '2030-08-03');
  assert.equal(availability.find((r) => r.id === 'r105').available, true);
});

/* ------------------------------------------------------------------ */
/* WhatsApp                                                           */
/* ------------------------------------------------------------------ */

test('the WhatsApp message includes the reference, dates and total', () => {
  clearStore();
  const booking = createBooking({
    roomId: 'r202',
    checkIn: '2030-09-10',
    checkOut: '2030-09-12',
    guest: { name: 'Daniel O', phone: '9876543210' },
  });

  const message = buildWhatsAppMessage(booking);
  assert.match(message, new RegExp(booking.reference));
  assert.match(message, /Deluxe/);
  assert.match(message, /Total:/);
});

test('the WhatsApp link points at wa.me with the hotel number', () => {
  clearStore();
  const booking = createBooking({
    roomId: 'r203',
    checkIn: '2030-09-10',
    checkOut: '2030-09-12',
    guest: { name: 'Daniel O', phone: '9876543210' },
  });

  const link = buildWhatsAppLink(booking);
  assert.ok(link.startsWith('https://wa.me/'));
  assert.ok(link.includes('text='));
});

test('the WhatsApp message never contains a room number', () => {
  clearStore();
  const booking = createBooking({
    roomId: 'r201',
    checkIn: '2030-09-10',
    checkOut: '2030-09-12',
    guest: { name: 'Daniel O', phone: '9876543210' },
  });

  const message = buildWhatsAppMessage(booking);

  // r201 is room 201 - the physical number must never reach the guest.
  assert.ok(!/\b201\b/.test(message), 'message must not contain the room number');
  assert.ok(!message.includes('Room number'));
  // The room *type* is still there.
  assert.match(message, /Room type: Deluxe/);
});

test('the WhatsApp message carries the booking details the hotel needs', () => {
  clearStore();
  const booking = createBooking({
    roomId: 'r202',
    checkIn: '2030-09-10',
    checkOut: '2030-09-12',
    guest: { name: 'Daniel O', phone: '9876543210', guests: 2 },
    extras: ['breakfast'],
    specialRequests: 'Late arrival',
  });

  const message = buildWhatsAppMessage(booking);

  assert.match(message, new RegExp(booking.reference));
  assert.match(message, /Room type: Deluxe/);
  assert.match(message, /Check-in:/);
  assert.match(message, /Check-out:/);
  assert.match(message, /Nights: 2/);
  assert.match(message, /Extras:/);
  assert.match(message, /Breakfast/);
  assert.match(message, /Phone: 9876543210/);
  assert.match(message, /Requests: Late arrival/);
  assert.match(message, /Total:/);
});

test('the amend message asks the hotel to change the booking', () => {
  clearStore();
  const booking = createBooking({
    roomId: 'r202',
    checkIn: '2030-09-10',
    checkOut: '2030-09-12',
    guest: { name: 'Daniel O', phone: '9876543210' },
  });

  const message = buildAmendWhatsAppMessage(booking);

  assert.match(message, /change my booking/i);
  assert.match(message, new RegExp(booking.reference));
  assert.ok(!/\b202\b/.test(message), 'message must not contain the room number');

  const link = buildAmendWhatsAppLink(booking);
  assert.ok(link.startsWith('https://wa.me/'));
  assert.ok(link.includes('text='));
});
