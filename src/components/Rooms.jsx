import { useEffect, useMemo, useState } from 'react';
import { HOTEL } from '../data/hotel.js';
import { ROOM_TYPES } from '../data/rooms.js';
import { getAvailability, matchesGuestCriteria, normalizeRoomTypeFilter } from '../utils/booking.js';
import { formatNumber } from '../utils/format.js';
import { formatPrice } from '../utils/pricing.js';
import { IconBed, IconEye, IconRuler, IconUsers } from './icons.jsx';
import RoomDetailsModal from './RoomDetailsModal.jsx';

const FILTERS = [
  { id: 'all', label: 'সব রুম' },
  { id: 'ac', label: 'এসি রুম' },
  { id: 'nonac', label: 'নন-এসি রুম' },
];

export default function Rooms({
  checkIn,
  checkOut,
  guests = 1,
  filter = 'all',
  onFilterChange,
  onSelectRoom,
}) {
  const [showAll, setShowAll] = useState(false);
  const [detailRoom, setDetailRoom] = useState(null);

  const availability = useMemo(() => getAvailability(checkIn, checkOut), [checkIn, checkOut]);

  // When browsing all rooms, show every room regardless of party size so the
  // full inventory is visible; specific type filters still respect capacity.
  const matched = availability.filter((room) =>
    filter === 'all' ? true : matchesGuestCriteria(room, guests, filter),
  );
  const freeCount = matched.filter((room) => room.available).length;
  const visible = showAll ? matched : matched.slice(0, 6);

  const openDetails = (room) => setDetailRoom(room);
  const closeDetails = () => setDetailRoom(null);
  const handleBookFromDetails = (room) => {
    setDetailRoom(null);
    onSelectRoom?.(room);
  };

  // A shorter list should start collapsed again.
  useEffect(() => {
    setShowAll(false);
  }, [filter, guests, checkIn, checkOut]);

  const normalizedFilter = normalizeRoomTypeFilter(filter);
  const typeLabel =
    normalizedFilter === 'all'
      ? null
      : normalizedFilter === 'ac'
        ? 'এসি'
        : normalizedFilter === 'nonac'
          ? 'নন-এসি'
          : ROOM_TYPES[filter]?.shortName;

  return (
    <section className="section" id="rooms">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">রুমগুলো</span>
          <h2 className="section__title">আমাদের রুমগুলো</h2>
          <p className="section__lead">
            আমাদের হোটেলের সকল রুম সবসময় পরিস্কার রাখার চেষ্টা করি। এই লিষ্ট দেখুন পছন্দের রুম বুক করুন।
          </p>
        </div>

        <div className="rooms__filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`filter-chip ${filter === item.id ? 'filter-chip--active' : ''}`}
              onClick={() => onFilterChange(item.id)}
            >
              {item.label}
            </button>
          ))}
          <span className="rooms__count">
            {matched.length === 0
              ? 'আপনার অনুসন্ধানে কোনো রুম মেলেনি'
              : `তারিখ অনুযায়ী ${formatNumber(freeCount)}/${formatNumber(matched.length)} ${typeLabel ? `${typeLabel} ` : ''
              }রুম ফাঁকা`}
          </span>
        </div>

        {matched.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 15,
              color: 'var(--ink-muted)',
            }}
          >
            {formatNumber(guests)} জন অতিথির উপযুক্ত কোনো রুম খুঁজে পাওয়া যায়নি। অন্য ক্যাটাগরি
            বা কম সংখ্যক অতিথি দিয়ে চেষ্টা করুন।
          </p>
        )}

        <div className="room-grid">
          {visible.map((room) => (
            <article
              key={room.id}
              data-room-id={room.id}
              data-room-number={room.number}
              className={`room-card ${room.available ? '' : 'room-card--unavailable'}`}
              onClick={() => openDetails(room)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDetails(room);
                }
              }}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div className="room-card__media">
                <img src={room.image} alt={`${room.name} - ${room.view}`} loading="lazy" />
                <span className="room-card__tag">{room.shortName}</span>
                <span className="room-card__number">রুম {room.number}</span>
              </div>

              <div className="room-card__body">
                <h3 className="room-card__name">{room.name}</h3>

                <div className="room-card__meta">
                  <span>
                    <IconUsers size={15} /> সর্বোচ্চ {formatNumber(room.capacity)} জন
                  </span>
                  <span>
                    <IconBed size={15} /> {room.beds}
                  </span>
                  <span>
                    <IconRuler size={15} /> {room.size}
                  </span>
                  <span>
                    <IconEye size={15} /> {room.view}
                  </span>
                </div>

                {room.canRentAsNonAc && (
                  <span className="room-card__budget-tag">
                    💰 নন-এসি হিসেবেও ভাড়া: {formatPrice(room.nonAcPrice)}/রাত
                  </span>
                )}

                <p className="room-card__desc">{room.description}</p>

                <div className="room-card__amenities">
                  {room.amenities.slice(0, 4).map((amenity) => (
                    <span key={amenity} className="amenity-tag">
                      {amenity}
                    </span>
                  ))}
                  {room.amenities.length > 4 && (
                    <span className="amenity-tag">
                      +{formatNumber(room.amenities.length - 4)} টি আরও
                    </span>
                  )}
                </div>

                <div className="room-card__footer">
                  <div>
                    <div className="room-card__price-label">প্রতি রাত</div>
                    <div className="room-card__price">
                      {formatPrice(room.basePrice)}
                      <small> / রাত</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn ${room.available ? 'btn--primary' : 'btn--ghost'}`}
                    disabled={!room.available}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectRoom?.(room);
                    }}
                  >
                    এই রুমটি বুক করুন
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {matched.length > 6 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? 'কম রুম দেখুন' : `সব ${formatNumber(matched.length)} টি রুম দেখুন`}
            </button>
          </div>
        )}

        <p
          style={{
            textAlign: 'center',
            marginTop: 32,
            fontSize: 14,
            color: 'var(--ink-muted)',
          }}
        >
          {HOTEL.currencyNote}। ভাড়ায় {HOTEL.taxLabel} ধরা হয় না — সহায়ক সেবা চেক-আউটের সময় যোগ
          করা যাবে।
        </p>
      </div>

      {detailRoom && (
        <RoomDetailsModal
          room={detailRoom}
          onClose={closeDetails}
          onBook={handleBookFromDetails}
        />
      )}
    </section>
  );
}

