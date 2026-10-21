import { useState } from 'react';
import { FAQS } from '../data/content.js';

export default function Faq() {
  const [openId, setOpenId] = useState(FAQS[0]?.id ?? null);

  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <section className="section section--sand" id="faq">
      <div className="container">
        <div className="section__head section__head--center">
          <span className="eyebrow">জানার মতো কথা</span>
          <h2 className="section__title">প্রায়শই জিজ্ঞাসিত প্রশ্ন</h2>
          <p className="section__lead">
            অতিথিরা সবচেয়ে বেশি যা জিজ্ঞেস করেন। আপনার প্রশ্নটি এখানে না থাকলে হোয়াটসঅ্যাপে
            বার্তা দিন — দ্রুত উত্তর দিই।
          </p>
        </div>

        <div className="faq">
          {FAQS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className={`faq__item ${isOpen ? 'faq__item--open' : ''}`}>
                <button
                  type="button"
                  className="faq__question"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span className="faq__icon" aria-hidden="true">
                    +
                  </span>
                </button>
                {isOpen && <div className="faq__answer">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
