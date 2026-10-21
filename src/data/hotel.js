/**
 * Central hotel configuration (কেন্দ্রীয় হোটেল তথ্য)।
 * Change the contact details here and every button across the site updates.
 * এখানে নম্বর-ঠিকানা বদলালেই সাইটের সব বোতাম নিজে থেকে আপডেট হয়ে যাবে।
 */
export const HOTEL = {
  name: 'হোটেল রিল্যাক্স আবাসিক',
  shortName: 'হোটেল রিল্যাক্স',
  tagline: 'যশোর রোডে নিশ্চিন্ত আবাস, সুন্দর বিশ্রাম',
  description:
    'হোটেল রিল্যাক্স আবাসিক — খুলনার শূন্য পয়েন্ট থেকে ৩০০ গজ উত্তরে, বিসমিল্লাহ সুপার মার্কেটের পাশে অবস্থিত একটি পরিবারবান্ধব আবাসিক হোটেল। তেরোটি পরিচ্ছন্ন রুম, ২৪/৭ ফ্রন্ট ডেস্ক ও স্বচ্ছ মূল্যে অবস্থান।',
  speciality: 'the hotel is protected by cctb 9 cctb',
  specialty: 'the hotel is protected by cctb 9 cctb',
  specialities: ['the hotel is protected by cctb 9 cctb'],
  specialties: ['the hotel is protected by cctb 9 cctb'],
  features: ['the hotel is protected by cctb 9 cctb'],
  founded: 2015,

  // ---- Contact channels -------------------------------------------------
  // Bangladesh local format. `phoneRaw` is used for tel: links (E.164).
  phone: '01711737730',
  phoneRaw: '+8801711737730',
  phoneDisplay: '01711-737730',
  phone2: '01711342970',
  phone2Raw: '+8801711342970',
  phone2Display: '01711-342970',
  // WhatsApp Business number -> digits only, no '+'.
  whatsappNumber: '8801711737730',
  whatsappNumber2: '8801711342970',
  email: 'hotelrelaxkhulna@gmail.com',

  // ---- Address ----------------------------------------------------------
  address: {
    line1: 'বিসমিল্লাহ সুপার মার্কেট',
    line2: 'যশোর রোড, শূন্য পয়েন্ট থেকে ৩০০ গজ উত্তরে',
    city: 'খুলনা',
    state: 'খুলনা বিভাগ',
    postalCode: '9100',
    country: 'বাংলাদেশ',
  },
  // Kept in English/Latin so Google Maps can resolve it reliably.
  mapQuery: 'Bismillah Super Market, Jessore Road, Khulna, Bangladesh',

  // ---- Booking defaults -------------------------------------------------
  currency: 'BDT',
  currencySymbol: '৳',
  currencyNote: 'সব দাম বাংলাদেশি টাকায় (৳)',
  locale: 'bn-BD',
  checkInTime: 'বিকাল ২টা',
  checkOutTime: 'সকাল ১১টা',
  maxGuestsPerRoom: 4,
  taxRate: 0.15, // ভ্যাট (VAT) — রুম ভাড়ার উপর ১৫%
  taxLabel: 'ভ্যাট (১৫%)',
};

export default HOTEL;
