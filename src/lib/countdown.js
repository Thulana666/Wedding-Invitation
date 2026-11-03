import { wedding } from '@/config/wedding';

/**
 * Time left until the ceremony. The configured start/end carry an explicit
 * +05:30 offset (Asia/Colombo), so the result is correct in any visitor timezone.
 */
export function getCountdown(now = Date.now()) {
  const start = Date.parse(wedding.date.start);
  const end = Date.parse(wedding.date.end);

  if (now >= end) return { state: 'after' };
  if (now >= start) return { state: 'during' };

  let rest = Math.floor((start - now) / 1000);
  const days = Math.floor(rest / 86400);
  rest -= days * 86400;
  const hours = Math.floor(rest / 3600);
  rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  const seconds = rest - minutes * 60;
  return { state: 'before', days, hours, minutes, seconds };
}
