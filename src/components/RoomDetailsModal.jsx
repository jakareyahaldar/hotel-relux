import { useEffect } from 'react';
import { formatNumber } from '../utils/format.js';
import { formatPrice } from '../utils/pricing.js';
import { IconClose, IconUsers, IconBed, IconRuler, IconEye } from './icons.jsx';

export default function RoomDetailsModal({ room, onClose, onBook }) {
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

  if (!room) return null;

  return (
    <div
      className="modal-backdrop2"
      role="dialog"
      aria-modal="true"
      aria-label={`${room.name} - বিস্তারিত`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal room-detail-modal">
        <div className="modal__head">
          <div>
            <h3 className="modal__title">{room.name}</h3>
            <p className="modal__subtitle">
              রুম {room.number} · {room.shortName} · এখন ফাঁকা
            </p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="বন্ধ করুন">
            <IconClose />
          </button>
        </div>

        <div className="modal__body room-detail-body">
          <div className="room-detail-media">
            <img src={room.image} alt={`${room.name} - ${room.view}`} />
            <span className="room-card__tag">{room.shortName}</span>
          </div>

          <p className="room-detail-desc">{room.description}</p>
          {room.canRentAsNonAc && (
            <>
              <span className="room-card__budget-tag room-card__budget-tag--modal">
                💰 নন-এসি হিসেবেও ভাড়া: {formatPrice(room.nonAcPrice)}/রাত
              </span>
              <p className="room-detail-note">
                এই রুমটি প্রয়োজনে নন-এসি হিসেবেও ভাড়া নেওয়া যায় — নন-এসি ভাড়া {formatPrice(room.nonAcPrice)}/রাত, বাজেট সাশ্রয়ী।
              </p>
            </>
          )}

          <div className="room-detail-meta">
            <span>
              <IconUsers size={16} /> সর্বোচ্চ {formatNumber(room.capacity)} জন
            </span>
            <span>
              <IconBed size={16} /> {room.beds}
            </span>
            <span>
              <IconRuler size={16} /> {room.size}
            </span>
            <span>
              <IconEye size={16} /> {room.view}
            </span>
            <span>তলা: {formatNumber(room.floor)}</span>
            <span>উইং: {room.wing}</span>
            {room.accessible && <span>হুইলচেয়ার অ্যাক্সেসযোগ্য</span>}
          </div>

          <h4 className="room-detail-heading">সব সুবিধা</h4>
          <div className="room-card__amenities room-detail-amenities">
            {room.amenities.map((amenity) => (
              <span key={amenity} className="amenity-tag">
                {amenity}
              </span>
            ))}
          </div>

          <div className="room-detail-price">
            <div>
              <div className="room-card__price-label">প্রতি রাত</div>
              <div className="room-card__price">
                {formatPrice(room.basePrice)}
                <small> / রাত</small>
              </div>
            </div>
          </div>
        </div>

        <div className="modal__foot">
          <button
            type="button"
            className={`btn ${room.available ? 'btn--primary' : 'btn--ghost'} btn--lg btn--block`}
            disabled={!room.available}
            onClick={() => onBook?.(room)}
          >
            এই রুমটি বুক করুন
          </button>
          <p className="modal__foot-note">
            রুম নম্বর বুকিং নিশ্চিত হওয়ার পর ফ্রন্ট ডেস্ক জানাবে।
          </p>
        </div>
      </div>
    </div>
  );
}
