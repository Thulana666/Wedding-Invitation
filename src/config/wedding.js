/**
 * Central wedding configuration.
 *
 * Every piece of wedding information shown on the website, used by the RSVP
 * form or exported from the admin dashboard is read from this file. Edit the
 * values here — components never hard-code wedding details.
 *
 * Items marked "PLACEHOLDER" are waiting for content from the couple.
 */

const bride = 'Dilki';
const groom = 'Supun';

export const wedding = {
  couple: {
    bride,
    groom,
    names: `${bride} & ${groom}`,
    monogram: { left: bride[0], right: groom[0] },
  },

  families: {
    bride: {
      label: 'Parents of the Bride',
      father: 'Mr. Primatha Sirigampala',
      mother: 'Mrs. Yamuna Sirigampala',
    },
    groom: {
      label: 'Parents of the Groom',
      father: 'Mr. Ananda Gamini',
      mother: 'Mrs. M.P. Leelawathi',
    },
  },

  invitation: {
    request: 'request the honor of your presence to celebrate the marriage of',
    wording:
      'Mr. Primatha Sirigampala & Mrs. Yamuna Sirigampala and Mr. Ananda Gamini & Mrs. M.P. Leelawathi request the honor of your presence to celebrate the marriage of Dilki & Supun.',
  },

  date: {
    // Sri Lanka has a fixed UTC+05:30 offset (Asia/Colombo, no daylight saving).
    timezone: 'Asia/Colombo',
    start: '2027-01-21T10:00:00+05:30',
    end: '2027-01-21T15:00:00+05:30',
    long: 'Thursday, January 21, 2027',
    hero: '21 January 2027',
    dotted: '21 · 01 · 2027',
    weekday: 'Thursday',
    startTime: '10:00 AM',
    time: '10:00 AM – 3:00 PM',
  },

  venue: {
    hotel: 'Saminro Grand Palace',
    hall: 'Crystal Ballroom (2nd Floor)',
    city: 'Makola',
    country: 'Sri Lanka',
    short: 'Saminro Grand Palace, Makola',
    // Map destination. This is a search for the venue name — it does not guess
    // coordinates. Once you have the exact Google Maps listing, paste its share
    // link into `directionsUrl` (and optionally an embed URL into `embedUrl`).
    mapsQuery: 'Saminro Grand Palace, Makola, Sri Lanka',
    directionsUrl: '',
    embedUrl: '',
  },

  /**
   * Official events. These also become the "Event attendance" choices in the
   * RSVP form and the admin exports.
   */
  events: [
    {
      id: 'poruwa',
      title: 'Poruwa Ceremony',
      time: '10:00 AM onwards',
      description: 'The traditional Poruwa ceremony marks the beginning of the celebration.',
    },
    {
      id: 'ceremony',
      title: 'The Wedding Ceremony',
      time: '10:00 AM – 3:00 PM',
      description: 'Join us for the wedding celebration at the Crystal Ballroom.',
    },
  ],

  contacts: [
    { name: 'Kasun', phone: '0716096978', display: '071 609 6978', tel: '+94716096978' },
    { name: 'Ayodhya', phone: '0705717793', display: '070 571 7793', tel: '+94705717793' },
  ],

  /** PLACEHOLDER — replace the copy below with the couple's own words. */
  story: {
    intro:
      'Every love story is beautiful, but ours is our favourite. Here is a little of how two hearts found their way to one another.',
    bride: {
      role: 'The Bride',
      bio: 'A few words about Dilki will be shared here soon — her warmth, her passions and the little things that make her who she is.',
    },
    groom: {
      role: 'The Groom',
      bio: 'A few words about Supun will be shared here soon — his kindness, his passions and the little things that make him who he is.',
    },
    together: {
      title: 'Together',
      text: 'Our story together will be told here — how we met, the moments that brought us closer, and the promise we are about to make.',
    },
  },

  /** Message revealed inside the envelope. PLACEHOLDER — edit freely. */
  letter: {
    greeting: 'Dear friends & family,',
    body: 'Two hearts, one promise. As we begin this beautiful new chapter of our lives, nothing would make us happier than to have you beside us, sharing the love, laughter and blessings of our wedding day.',
    signOff: 'With love,',
  },

  scratch: {
    teaser: 'Something beautiful is waiting for you…',
    reveal: 'Dilki & Supun are getting married!',
  },

  rsvp: {
    headline: 'Will You Be Joining Our Celebration?',
    // RSVP deadline. PLACEHOLDER — set an ISO date (e.g. '2026-12-31') to show it.
    deadline: '',
    // When true, anyone with the main link can RSVP. Each open response gets
    // `defaultMaxGuests`. Personal invitation links use the per-guest limit
    // set in the admin dashboard.
    allowOpenRsvp: true,
    // Total party size allowed, including the guest themself.
    defaultMaxGuests: 2,
    maxGuestsLimit: 12,
    acceptedMessage: "We can't wait to celebrate this special day with you!",
    declinedMessage: "Thank you for letting us know. You'll be missed!",
  },

  music: {
    // Local audio file — see public/audio/README.md for replacing it.
    src: '/audio/wedding-theme.mp3',
    title: 'Ivory & Gold',
    artist: 'Original piano theme',
    volume: 0.55,
  },

  images: {
    // Drop the couple's photographs into public/images and keep these paths,
    // or change the paths here. See public/images/README.md.
    bride: { src: '/images/story/bride.jpg', alt: 'Dilki' },
    groom: { src: '/images/story/groom.jpg', alt: 'Supun' },
    together: { src: '/images/story/together.jpg', alt: 'Dilki and Supun together' },
    invitation: { src: '/images/story/invitation.jpg', alt: 'Dilki and Supun' },
  },

  /**
   * Pre-wedding photoshoot gallery. `layout` controls the editorial grid:
   * 'feature' (full width), 'wide', 'tall' or 'square'. The grid is designed
   * around repeating groups of: tall, square, square, wide — framed by
   * feature images. Keep that rhythm when adding photos to avoid gaps.
   */
  gallery: [
    { src: '/images/gallery/gallery-01.jpg', layout: 'feature', caption: 'Pre-shoot photograph 01', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-02.jpg', layout: 'tall', caption: 'Pre-shoot photograph 02', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-03.jpg', layout: 'square', caption: 'Pre-shoot photograph 03', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-04.jpg', layout: 'square', caption: 'Pre-shoot photograph 04', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-05.jpg', layout: 'wide', caption: 'Pre-shoot photograph 05', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-06.jpg', layout: 'tall', caption: 'Pre-shoot photograph 06', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-07.jpg', layout: 'square', caption: 'Pre-shoot photograph 07', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-08.jpg', layout: 'square', caption: 'Pre-shoot photograph 08', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-09.jpg', layout: 'wide', caption: 'Pre-shoot photograph 09', alt: 'Pre-wedding photograph of Dilki and Supun' },
    { src: '/images/gallery/gallery-10.jpg', layout: 'feature', caption: 'Pre-shoot photograph 10', alt: 'Pre-wedding photograph of Dilki and Supun' },
  ],

  seo: {
    title: 'Dilki & Supun — Wedding Invitation · 21 January 2027',
    description:
      'Together with their families, Dilki & Supun request the honor of your presence on Thursday, January 21, 2027 at Saminro Grand Palace, Makola.',
  },
};

export const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'story', label: 'Our Story' },
  { id: 'details', label: 'Wedding Details' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'rsvp', label: 'RSVP' },
];

export function mapsSearchUrl() {
  const { directionsUrl, mapsQuery } = wedding.venue;
  if (directionsUrl) return directionsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
}

export function mapsDirectionsUrl() {
  const { directionsUrl, mapsQuery } = wedding.venue;
  if (directionsUrl) return directionsUrl;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}`;
}

export function mapsEmbedUrl() {
  const { embedUrl, mapsQuery } = wedding.venue;
  if (embedUrl) return embedUrl;
  return `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`;
}

/**
 * Public site address: NEXT_PUBLIC_SITE_URL if set (e.g. a custom domain),
 * otherwise the production address Vercel provides automatically.
 */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}
