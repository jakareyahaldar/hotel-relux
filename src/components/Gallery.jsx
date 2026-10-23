import { useEffect, useState } from 'react';
import { GALLERY } from '../data/rooms.js';

const INITIAL_VISIBLE = 4;
const LOAD_STEP = 4;

export default function Gallery() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [selectedImage, setSelectedImage] = useState(null);

  const visible = GALLERY.slice(0, visibleCount);
  const hasMore = visibleCount < GALLERY.length;

  useEffect(() => {
    if (!selectedImage) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event) => {
      if (event.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', handleKey);
    };
  }, [selectedImage]);

  return (
    <section className="section section--sand" id="gallery">
      <div className="container">
        <div className="section__head section__head--center">
          <span className="eyebrow">গ্যালারি</span>
          <h2 className="section__title">হোটেলের চারপাশে এক নজরে</h2>
          <p className="section__lead">
            জানালার ফাঁক দিয়ে রোদ, সকালের প্রাণবন্ত ছবি, আর পরিচ্ছন্ন কর্মচারীদের পরিশ্রম —
            এখানকার দৈনন্দিন জীবনের কয়েকটি ঝলক।
          </p>
        </div>

        <div className="gallery">
          {visible.map((item) => (
            <figure
              key={item.id}
              className="gallery__item"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedImage(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedImage(item);
                }
              }}
            >
              <img src={item.image} alt={item.caption} loading="lazy" />
              <figcaption className="gallery__caption">{item.caption}</figcaption>
            </figure>
          ))}
        </div>

        {hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <button
              type="button"
              className="btn btn--ghost"
              data-load-more="true"
              onClick={() =>
                setVisibleCount((count) => Math.min(count + LOAD_STEP, GALLERY.length))
              }
            >
              আরও ছবি দেখুন
            </button>
          </div>
        )}

        {selectedImage && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.caption}
            onClick={() => setSelectedImage(null)}
            style={{ alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
          >
            <div
              className="gallery-lightbox"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="modal__close gallery-lightbox__close"
                aria-label="বন্ধ করুন"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
              <img
                src={selectedImage.image}
                alt={selectedImage.caption}
                className="gallery-lightbox__image"
              />
              <p className="gallery-lightbox__caption">{selectedImage.caption}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


