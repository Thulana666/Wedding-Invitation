/** Fine-line icons used across the wedding details. 24×24, stroke-based. */

const base = {
  width: 28,
  height: 28,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const RingsIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="14.5" r="5.5" />
    <circle cx="15" cy="14.5" r="5.5" />
    <path d="M15 6.2l1.8 1.6L15 9.6l-1.8-1.8z" />
    <path d="M13.2 7.8h3.6" />
  </svg>
);

export const LotusIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5c2 2.2 2.8 4.8 2.2 8.2-.6 2.2-1.4 3.4-2.2 4.3-.8-.9-1.6-2.1-2.2-4.3C9.2 9.8 10 7.2 12 5z" />
    <path d="M9.8 13.2C7.6 11 5.4 10.4 3.5 10.6c.4 3.4 2.6 6.4 8.5 6.9" />
    <path d="M14.2 13.2c2.2-2.2 4.4-2.8 6.3-2.6-.4 3.4-2.6 6.4-8.5 6.9" />
    <path d="M4 19.5h16" />
  </svg>
);

export const VenueIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M3 20.5h18" />
    <path d="M4.5 20.5V10M19.5 20.5V10" />
    <path d="M2.8 10h18.4L12 4z" />
    <path d="M8 20.5v-6M12 20.5v-6M16 20.5v-6" />
  </svg>
);

export const ClockIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const CalendarIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M12 16.6l-2.2-2.1a1.3 1.3 0 0 1 2.2-1 1.3 1.3 0 0 1 2.2 1z" />
  </svg>
);

export const PinIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

export const PhoneIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" />
  </svg>
);

export const ArrowIcon = (p) => (
  <svg {...base} width={18} height={18} strokeWidth={1.6} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
