import { useEffect } from 'react';
import { IconClose } from './icons.jsx';

const NOTICE_TEXT =
  'কোনো রকম অনৈতিক কার্যকলাপ সমর্থন করা হয় না। অযথা অনৈতিক কোনো কিছুর জন্য ফোন দেওয়া থেকে বিরত থাকুন।';

const SCROLLING_TEXT = `${NOTICE_TEXT}  ★  ${NOTICE_TEXT}   ★   ${NOTICE_TEXT}`;

export default function Notice({ open = false, onClose }) {
  // Lock body scroll while the popup is open.
  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('no-scroll');
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.classList.remove('no-scroll');
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Desktop top notice bar. Hidden on mobile via CSS. */}
      <div className="site-notice" role="alert">
        <span className="site-notice__icon" aria-hidden="true">⚠️</span>
        <span className="site-notice__track">
          <span className="site-notice__text">{SCROLLING_TEXT}</span>
        </span>
      </div>

      {/* Mobile / on-demand popup notice. */}
      {open && (
        <div
          className="modal-backdrop notice-popup-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="নোটিশ"
          onClick={onClose}
        >
          <div className="modal notice-popup" onClick={(event) => event.stopPropagation()}>
            <div className="modal__head">
              <div>
                <h3 className="modal__title">⚠️ নোটিশ</h3>
                <p className="modal__subtitle">হোটেল রিল্যাক্স আবাসিক</p>
              </div>
              <button
                type="button"
                className="modal__close"
                onClick={onClose}
                aria-label="বন্ধ করুন"
              >
                <IconClose />
              </button>
            </div>
            <div className="modal__body">
              <p className="notice-popup__text">{NOTICE_TEXT}</p>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn--gold btn--block" onClick={onClose}>
                বুঝেছি
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
