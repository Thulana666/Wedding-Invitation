import { wedding, siteUrl } from '@/config/wedding';

const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escape = (s) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/** Builds an .ics calendar file for the wedding ceremony. */
export function weddingIcs() {
  const { couple, date, venue } = wedding;
  const location = `${venue.hall}, ${venue.hotel}, ${venue.city}, ${venue.country}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dilki & Supun//Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:dilki-supun-wedding-20270121@${new URL(siteUrl()).host}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(date.start)}`,
    `DTEND:${stamp(date.end)}`,
    `SUMMARY:${escape(`Wedding of ${couple.names}`)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(`Poruwa Ceremony from ${date.startTime}. ${siteUrl()}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadIcs() {
  const blob = new Blob([weddingIcs()], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dilki-supun-wedding.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
