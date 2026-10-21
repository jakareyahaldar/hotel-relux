import { ROOMS_WITH_DETAILS, TOTAL_ROOMS } from '../data/rooms.js';
import { dateRange, nightsBetween } from './dates.js';

/**
 * Bookings are stored in the browser's localStorage so the site works as a
 * pure frontend with no backend. Swap `readBookings` / `writeBookings` for
 * real API calls when you connect a server.
 */
const STORAGE_KEY = 'relax.bookings.v1';

/** Read every stored booking. */
export function readBookings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist the booking list. */
export function writeBookings(bookings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.warn('[bookings] Unable to persist bookings:', error.message);
  }
}

/** Rooms already occupied for the requested nights. */
export function occupiedRoomIds(checkIn, checkOut) {
  const nights = new Set(dateRange(checkIn, checkOut));
  const occupied = new Set();

  for (const booking of readBookings()) {
    if (booking.status === 'cancelled') continue;
    const bookingNights = new Set(dateRange(booking.checkIn, booking.checkOut));
    for (const night of nights) {
      if (bookingNights.has(night)) {
        occupied.add(booking.roomId);
        break;
      }
    }
  }

  return occupied;
}

/**
 * Availability for a date range.
 * Each room comes back with an `available` flag and the reason if not.
 */
export function getAvailability(checkIn, checkOut) {
  if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) < 1) {
    return ROOMS_WITH_DETAILS.map((room) => ({
      ...room,
      available: false,
      unavailableReason: 'সঠিক তারিখ নির্বাচন করুন',
    }));
  }

  const occupied = occupiedRoomIds(checkIn, checkOut);

  return ROOMS_WITH_DETAILS.map((room) => {
    const isOccupied = occupied.has(room.id);
    return {
      ...room,
      available: !isOccupied,
      unavailableReason: isOccupied ? 'এই তারিখে বুক হয়ে গেছে' : null,
    };
  });
}

/**
 * Does a room suit a party?
 *
 * A room must be big enough for everyone and match the requested type.
 * `type` of 'all' (or a blank value) means "any room type".
 */
export function matchesGuestCriteria(room, guests = 1, type = 'all') {
  if (!room) return false;
  const party = Math.max(1, Number(guests) || 1);
  if (room.capacity < party) return false;
  if (type && type !== 'all' && room.type !== type) return false;
  return true;
}

/**
 * Every room a guest can actually book: free for the nights, big enough for
 * the party, and matching the requested room type.
 */
export function getBookableRooms(checkIn, checkOut, { guests = 1, type = 'all' } = {}) {
  return getAvailability(checkIn, checkOut).filter(
    (room) => room.available && matchesGuestCriteria(room, guests, type),
  );
}

/** Summary of how many rooms are free, broken down by tier. */
export function getAvailabilitySummary(checkIn, checkOut) {
  const rooms = getAvailability(checkIn, checkOut);
  const available = rooms.filter((room) => room.available).length;

  const byType = ['classic', 'deluxe', 'suite'].map((typeId) => {
    const typeRooms = rooms.filter((room) => room.type === typeId);
    return {
      type: typeId,
      total: typeRooms.length,
      available: typeRooms.filter((room) => room.available).length,
    };
  });

  return {
    checkIn,
    checkOut,
    nights: nightsBetween(checkIn, checkOut),
    totalRooms: TOTAL_ROOMS,
    availableRooms: available,
    occupiedRooms: TOTAL_ROOMS - available,
    byType,
  };
}
