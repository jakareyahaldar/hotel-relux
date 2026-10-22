/**
 * The hotel's complete inventory: 13 rooms across 3 tiers.
 *
 * ৫টি ক্লাসিক রুম (১০১ - ১০৫)  - বাগান উইং, ২ জন
 * ৫টি ডিলাক্স রুম   (২০১ - ২০৫)  - মূল ভবন, ৩ জন
 * ৩টি সুইট        (৩০১ - ৩০৩)  - উপরের তলা, ৪ জন
 */
export const ROOM_TYPES = {
  ac3bed: {
    id: 'ac3bed',
    name: 'এসি ৩ বেড (কাপল+সিংগেল) রুম',
    shortName: 'এসি ৩ বেড',
    basePrice: 1500,
    capacity: 3,
    bed: 'কাপল + সিংগেল',
    size: '৩০ বর্গ মিটার',
    view: 'শহরের দৃশ্য',
    description: 'এসি সুবিধাসহ তিন বেডের রুম — দম্পতি ও একজন অতিরিক্ত অতিথির জন্য আরামদায়ক।',
    amenities: ['এয়ার কন্ডিশনার', 'ফ্রি ওয়াই-ফাই', 'স্মার্ট টিভি', 'সংযুক্ত বাথরুম'],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
  },
  accouple: {
    id: 'accouple',
    name: 'এসি কাপল রুম',
    shortName: 'এসি কাপল',
    basePrice: 1300,
    capacity: 2,
    bed: '১টি ডাবল বেড',
    size: '২৪ বর্গ মিটার',
    view: 'শহরের দৃশ্য',
    description: 'এসি সুবিধাসহ দম্পতিদের জন্য আরামদায়ক রুম।',
    amenities: ['এয়ার কন্ডিশনার', 'ফ্রি ওয়াই-ফাই', 'স্মার্ট টিভি', 'সংযুক্ত বাথরুম'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  },
  acsingle: {
    id: 'acsingle',
    name: 'এসি সিংগেল রুম',
    shortName: 'এসি সিংগেল',
    basePrice: 1000,
    capacity: 1,
    bed: '১টি সিংগেল বেড',
    size: '১৮ বর্গ মিটার',
    view: 'শহরের দৃশ্য',
    description: 'এসি সুবিধাসহ একক অতিথির জন্য রুম।',
    amenities: ['এয়ার কন্ডিশনার', 'ফ্রি ওয়াই-ফাই', 'স্মার্ট টিভি'],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
  },
  nonaccouple: {
    id: 'nonaccouple',
    name: 'নন এসি কাপল রুম',
    shortName: 'নন এসি কাপল',
    basePrice: 1000,
    capacity: 2,
    bed: '১টি ডাবল বেড',
    size: '২৪ বর্গ মিটার',
    view: 'শহরের দৃশ্য',
    description: 'নন-এসি দম্পতিদের জন্য আরামদায়ক রুম।',
    amenities: ['ফ্যান', 'ফ্রি ওয়াই-ফাই', 'স্মার্ট টিভি', 'সংযুক্ত বাথরুম'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  },
  nonac3bed: {
    id: 'nonac3bed',
    name: 'নন এসি ৩ বেড রুম',
    shortName: 'নন এসি ৩ বেড',
    basePrice: 1000,
    capacity: 3,
    bed: '৩টি সিংগেল বেড',
    size: '৩০ বর্গ মিটার',
    view: 'শহরের দৃশ্য',
    description: 'নন-এসি তিন বেডের রুম — পরিবার বা বন্ধুদের জন্য আরামদায়ক।',
    amenities: ['ফ্যান', 'ফ্রি ওয়াই-ফাই', 'স্মার্ট টিভি', 'সংযুক্ত বাথরুম'],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
  },
  nonacsingle: {
    id: 'nonacsingle',
    name: 'নন এসি সিংগেল রুম',
    shortName: 'নন এসি সিংগেল',
    basePrice: 500,
    capacity: 1,
    bed: '১টি সিংগেল বেড',
    size: '১৬ বর্গ মিটার',
    view: 'শহরের দৃশ্য',
    description: 'নন-এসি একক অতিথির জন্য সাশ্রয়ী রুম।',
    amenities: ['ফ্যান', 'ফ্রি ওয়াই-ফাই'],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
  },
};

export const ROOMS = [
  { id: 'r101', number: '101', type: 'ac3bed', floor: 1, wing: 'মূল ভবন', beds: 'কাপল + সিংগেল', accessible: true },
  { id: 'r102', number: '102', type: 'ac3bed', floor: 1, wing: 'মূল ভবন', beds: 'কাপল + সিংগেল', accessible: false },
  { id: 'r103', number: '103', type: 'accouple', floor: 1, wing: 'মূল ভবন', beds: '১টি ডাবল বেড', accessible: false },
  { id: 'r104', number: '104', type: 'accouple', floor: 1, wing: 'মূল ভবন', beds: '১টি ডাবল বেড', accessible: false },
  { id: 'r105', number: '105', type: 'acsingle', floor: 1, wing: 'মূল ভবন', beds: '১টি সিংগেল বেড', accessible: true },
  { id: 'r201', number: '201', type: 'acsingle', floor: 2, wing: 'মূল ভবন', beds: '১টি সিংগেল বেড', accessible: true },
  { id: 'r202', number: '202', type: 'nonaccouple', floor: 2, wing: 'মূল ভবন', beds: '১টি ডাবল বেড', accessible: false },
  { id: 'r203', number: '203', type: 'nonaccouple', floor: 2, wing: 'মূল ভবন', beds: '১টি ডাবল বেড', accessible: false },
  { id: 'r204', number: '204', type: 'nonac3bed', floor: 2, wing: 'মূল ভবন', beds: '৩টি সিংগেল বেড', accessible: false },
  { id: 'r205', number: '205', type: 'nonac3bed', floor: 2, wing: 'মূল ভবন', beds: '৩টি সিংগেল বেড', accessible: false },
  { id: 'r301', number: '301', type: 'nonacsingle', floor: 3, wing: 'উপরের তলা', beds: '১টি সিংগেল বেড', accessible: true },
  { id: 'r302', number: '302', type: 'nonacsingle', floor: 3, wing: 'উপরের তলা', beds: '১টি সিংগেল বেড', accessible: false },
  { id: 'r303', number: '303', type: 'nonacsingle', floor: 3, wing: 'উপরের তলা', beds: '১টি সিংগেল বেড', accessible: false },
];

/** Attach the type details (price, amenities, image) onto each room. */
export const ROOMS_WITH_DETAILS = ROOMS.map((room) => ({
  ...room,
  ...ROOM_TYPES[room.type],
  id: room.id,
  number: room.number,
  type: room.type,
}));

export const TOTAL_ROOMS = ROOMS.length;

/** Look up a single room's full details by id (single source of truth). */
export function getRoomById(id) {
  return ROOMS_WITH_DETAILS.find((room) => room.id === id) || null;
}


/** Add-ons a guest can bolt onto a stay. (সহায়ক সেবা) */
export const EXTRA_SERVICES = [
  { id: 'breakfast', label: 'সকালের নাশতা', note: 'প্রতি রাত', price: 350, perNight: true },
  { id: 'airport-pickup', label: 'বাসস্ট্যান্ড ও রেলস্টেশন পিকআপ-ড্রপ', note: 'এককালীন', price: 800, perNight: false },
  { id: 'late-checkout', label: 'দেরিতে চেক-আউট', note: 'বিকাল ৪টা পর্যন্ত, প্রতি রাত', price: 500, perNight: true },
  { id: 'flowers', label: 'ফুল ও স্বাগত বাস্কেট', note: 'এককালীন', price: 450, perNight: false },
];

export const GALLERY = [
  { id: 'g1', caption: 'ভোরের শীতল রুম', image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80' },
  { id: 'g2', caption: 'উঠানে সকালের নাশতা', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80' },
  { id: 'g3', caption: 'সুইটের বসার কক্ষ', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80' },
  { id: 'g4', caption: 'ঝরনো শাওয়ার', image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=900&q=80' },
  { id: 'g5', caption: 'শহরের রাস্তা', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=900&q=80' },
  { id: 'g6', caption: 'পড়ার কোণ', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80' },
];

export const TESTIMONIALS = [
  {
    id: 't1',
    quote:
      'রাত সাড়ে এগারটায় হোয়াটসঅ্যাপে বুক করেছিলাম, সকালের মধ্যেই রুম পাওয়া গিয়েছিল। পুরোটা কাজ চার-পাঁচ মিনিটের ছিল।',
    name: 'রুবাইয়াত হক',
    trip: 'ডিলাক্স রুম ২০৩-এ অবস্থান',
  },
  {
    id: 't2',
    quote:
      'মাত্র তেরোটি রুম হওয়ায় কখনো ভিড় লাগে না। কর্মচারীদের সাথে পরিচয় হয়ে যায়, আমার চায়ের পছন্দও তাঁরা মনে রাখে।',
    name: 'তানভীর আহমেদ',
    trip: 'ক্লাসিক রুম ১০২-এ অবস্থান',
  },
  {
    id: 't3',
    quote:
      'সুইটে থাকাটা সত্যিই দারুণ। বৃষ্টির দিনে পুরোটা সময় ঘরেই কাটিয়েছি, বের হতে ইচ্ছাই করেনি।',
    name: 'নুসরাত ও ফারহানা',
    trip: 'রিল্যাক্স সুইট ৩০১-এ অবস্থান',
  },
];

