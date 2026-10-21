import { TESTIMONIALS } from '../data/rooms.js';
import { IconStar } from './icons.jsx';

export default function Testimonials() {
  return (
    <section className="section" id="reviews">
      <div className="container">
        <div className="section__head section__head--center">
          <span className="eyebrow">অতিথিদের মতামত</span>
          <h2 className="section__title">অতিথিরা যা বলছেন</h2>
          <p className="section__lead">
            ৩৮০টি যাচাইকৃত অবস্থান থেকে ৫-এর মধ্যে ৪.৯। কয়েকটি মতামত, নিজেদের ভাষায়।
          </p>
        </div>

        <div className="testimonials">
          {TESTIMONIALS.map((testimonial) => (
            <article key={testimonial.id} className="testimonial">
              <div className="testimonial__stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconStar key={star} size={15} />
                ))}
              </div>
              <p className="testimonial__quote">“{testimonial.quote}”</p>
              <div>
                <div className="testimonial__name">{testimonial.name}</div>
                <div className="testimonial__trip">{testimonial.trip}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
