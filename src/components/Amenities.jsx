import { AMENITIES, CHECKLIST } from '../data/content.js';
import { IconCheck, IconClock, IconRuler, IconStar, IconUsers } from './icons.jsx';

const ICONS = {
  wifi: IconStar,
  breakfast: IconClock,
  transfer: IconUsers,
  spa: IconStar,
  laundry: IconRuler,
  parking: IconCheck,
};

export default function Amenities() {
  return (
    <section className="section section--dark" id="amenities">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">সুবিধাসমূহ</span>
          <h2 className="section__title">যা যা দরকার, সবই আছে — চাইতে হবে না</h2>
          <p className="section__lead">
            প্রয়োজনীয় সবকিছু ঠিকঠাক রাখা আছে। অন্য কিছু দরকার হলে ফ্রন্ট ডেস্কে জানান - আমরা যথাসাধ্য সাহায্য করার চেষ্টা করব।
          </p>
        </div>

        <div className="amenities-grid">
          {AMENITIES.map((amenity) => {
            const Icon = ICONS[amenity.icon] || IconStar;
            return (
              <article key={amenity.id} className="amenity">
                <div className="amenity__icon">
                  <Icon size={24} />
                </div>
                <h3 className="amenity__title">{amenity.title}</h3>
                <p className="amenity__text">{amenity.text}</p>
              </article>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 56,
            padding: 32,
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(232, 221, 203, 0.14)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {CHECKLIST.map((item) => (
            <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--gold-light)', flexShrink: 0, marginTop: 2 }}>
                <IconCheck size={18} />
              </span>
              <span style={{ fontSize: 15, color: 'rgba(232, 221, 203, 0.85)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
