import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Notice from './components/Notice.jsx';
import Hero from './components/Hero.jsx';
import BookingBar from './components/BookingBar.jsx';
import Rooms from './components/Rooms.jsx';
import Gallery from './components/Gallery.jsx';
import Amenities from './components/Amenities.jsx';
import Testimonials from './components/Testimonials.jsx';
import Faq from './components/Faq.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import FloatingActions from './components/FloatingActions.jsx';
import BookingModal from './components/BookingModal.jsx';
import Reveal from './components/Reveal.jsx';
import { addDays, today } from './utils/dates.js';
import { getBookableRooms } from './utils/booking.js';
import { ROOM_TYPES } from './data/rooms.js';

export default function App() {
  // Default stay: tonight for two nights.
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 2));
  const [guests, setGuests] = useState(2);
  const [roomType, setRoomType] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [toast, setToast] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);

  // On mobile devices the top notice bar is hidden, so show the notice as a
  // popup the first time a visitor lands. Remember the show time for 30
  // minutes so it does not pop up again for the same visitor.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (!isMobile) return undefined;
    const STORAGE_KEY = 'hotelRelaxNoticeShownAt';
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const lastShown = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    const now = Date.now();
    if (!lastShown || now - lastShown > THIRTY_MINUTES) {
      setNoticeOpen(true);
      window.localStorage.setItem(STORAGE_KEY, String(now));
    }
    return undefined;
  }, []);

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Keep the checkout date after the check-in date.
  useEffect(() => {
    if (checkOut <= checkIn) {
      setCheckOut(addDays(checkIn, 1));
    }
  }, [checkIn, checkOut]);

  // Availability is re-read whenever a booking is created or cancelled.
  const [availabilityKey, setAvailabilityKey] = useState(0);

  const handleDateChange = useCallback((changes) => {
    if (changes.checkIn !== undefined) {
      const nextCheckIn = changes.checkIn;
      setCheckIn(nextCheckIn);
      if (changes.checkOut === undefined) {
        setCheckOut(addDays(nextCheckIn || today(), 1));
      }
    }
    if (changes.checkOut !== undefined) setCheckOut(changes.checkOut);
    if (changes.guests !== undefined) setGuests(changes.guests);
    if (changes.roomType !== undefined) setRoomType(changes.roomType);
  }, []);

  const handleSearch = useCallback(() => {
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleBook = useCallback(() => {
    // Only rooms that are free, big enough for the party and of the requested
    // type can be booked.
    const bookable = getBookableRooms(checkIn, checkOut, { guests, type: roomType });
    if (bookable.length > 0) {
      setSelectedRoom(bookable[0]);
      return;
    }

    // Nothing matched - explain why instead of opening an unsuitable room.
    const anyFree = getBookableRooms(checkIn, checkOut, { guests: 1, type: 'all' });
    if (anyFree.length === 0) {
      setToast('এই তারিখে কোনো রুম খালি নেই। অন্য তারিখ দিয়ে চেষ্টা করুন।');
      return;
    }

    const typeLabel =
      roomType === 'all'
        ? null
        : roomType === 'ac'
          ? 'এসি'
          : roomType === 'nonac'
            ? 'নন-এসি'
            : ROOM_TYPES[roomType]?.shortName;
    setToast(
      typeLabel
        ? `${typeLabel} রুমে ${guests} জন অতিথি থাকতে পারে না। অন্য রুমের ধরন বেছে নিন।`
        : `${guests} জন অতিথির জন্য কোনো রুম নেই। অন্য রুমের ধরন বেছে নিন বা অতিথি কমান।`,
    );
  }, [checkIn, checkOut, guests, roomType]);

  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(room);
  }, []);

  // Cancelling a booking frees the room again, so the availability has to be
  // re-read to keep the room list in sync.
  const handleAvailabilityChange = useCallback(() => {
    setAvailabilityKey((key) => key + 1);
  }, []);

  const handleOpenNotice = useCallback(() => {
    setNoticeOpen(true);
  }, []);

  const handleCloseNotice = useCallback(() => {
    setNoticeOpen(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedRoom(null);
    setAvailabilityKey((key) => key + 1);
  }, []);

  return (
    <div className="app" data-availability-key={availabilityKey}>
      <Notice open={noticeOpen} onClose={handleCloseNotice} />
      <Header onBook={handleBook} />

      <main>
        <Hero onBook={handleSearch} onCall={() => {}} onWhatsApp={() => {}} onNotice={handleOpenNotice} />

        <BookingBar
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          roomType={roomType}
          onChange={handleDateChange}
          onSearch={handleSearch}
          onBook={handleBook}
        />

        <Rooms
          key={availabilityKey}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          filter={roomType}
          onFilterChange={setRoomType}
          onSelectRoom={handleSelectRoom}
        />

        <Reveal>
          <Gallery />
        </Reveal>
        <Reveal>
          <Amenities />
        </Reveal>
        <Reveal>
          <Testimonials />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        <Reveal>
          <Contact onBook={handleBook} />
        </Reveal>
      </main>

      <Footer onBook={handleBook} />

      <FloatingActions onNotice={handleOpenNotice} />

      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          onClose={handleCloseModal}
          onToast={setToast}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
