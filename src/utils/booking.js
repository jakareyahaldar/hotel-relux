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
export function occupiedRoomIds() {
  return new Set();
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

  return ROOMS_WITH_DETAILS.map((room) => ({
    ...room,
    available: true,
    unavailableReason: null,
  }));
}

/**
 * Normalise a room-type filter value into one of the canonical buckets used
 * throughout the app: 'all', 'ac', 'nonac', or a specific room type id.
 *
 * Accepts the various spellings a caller might use (e.g. 'non-ac', 'non ac',
 * 'non-ac rooms') so filtering stays robust.
 */
export function normalizeRoomTypeFilter(type) {
  if (type === null || type === undefined || type === '') return 'all';
  const value = String(type).trim().toLowerCase().replace(/[\\s-]+/g, '');
  if (value === 'all' || value === 'any' || value === 'allrooms') return 'all';
  if (value === 'ac' || value === 'acrooms' || value === 'acroom') return 'ac';
  if (
    value === 'nonac' ||
    value === 'nonacrooms' ||
    value === 'nonacroom' ||
    value === 'nonaircon'
  ) {
    return 'nonac';
  }
  return String(type).trim();
}

/**
 * Does a room suit a party?
 *
 * A room must be big enough for everyone and match the requested type.
 * `type` may be 'all' (any room), 'ac' (any AC room), 'nonac' (any non-AC
 * room) or a specific room type id. A blank value means "any room type".
 */
export function matchesGuestCriteria(room, guests = 1, type = 'all') {
  if (!room) return false;
  const party = Math.max(1, Number(guests) || 1);
  if (room.capacity < party) return false;

  const filter = normalizeRoomTypeFilter(type);
  if (filter === 'all') return true;

  const roomType = String(room.type || '').toLowerCase();
  if (filter === 'ac') return roomType.startsWith('ac');
  if (filter === 'nonac') return roomType.startsWith('nonac');

  // Specific room type id (or any unrecognised value): exact match.
  return room.type === type || roomType === String(filter).toLowerCase();
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

  const byType = ['ac', 'nonac'].map((typeId) => {
    const typeRooms = rooms.filter((room) =>
      typeId === 'ac'
        ? String(room.type || '').toLowerCase().startsWith('ac')
        : String(room.type || '').toLowerCase().startsWith('nonac'),
    );
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
