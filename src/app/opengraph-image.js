import { ImageResponse } from 'next/og';
import { wedding } from '@/config/wedding';

export const alt = 'An invitation to the wedding of Dilki & Supun';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Loads a Google Font subset as TTF for the preview image; falls back to the default font.
async function font(family, weight, text) {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    return res.ok ? res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const names = wedding.couple.names;
  const invited = 'YOU ARE INVITED TO THE WEDDING OF';
  const open = 'Open to view your invitation';

  const [script, serif] = await Promise.all([
    font('Pinyon+Script', 400, names),
    font('Cormorant+Garamond', 500, invited + open),
  ]);

  const fonts = [];
  if (script) fonts.push({ name: 'Script', data: script, weight: 400, style: 'normal' });
  if (serif) fonts.push({ name: 'Serif', data: serif, weight: 500, style: 'normal' });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 40%, #4a3b39 0%, #2d2322 60%, #1c1615 100%)',
        }}
      >
        <div
          style={{
            width: 1080,
            height: 520,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(170deg, #fffdf8 0%, #f8f3ea 55%, #efe6d8 100%)',
            border: '2px solid #c5a45a',
            color: '#352b2b',
            fontFamily: 'Serif',
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 8, color: '#a4843f' }}>{invited}</div>
          <div style={{ fontFamily: 'Script', fontSize: 160, lineHeight: 1.25, color: '#a4843f', marginTop: 14 }}>{names}</div>
          <div style={{ width: 160, height: 1, background: '#c5a45a', margin: '30px 0 26px' }} />
          <div style={{ fontSize: 30, letterSpacing: 2, color: 'rgba(53,43,43,0.75)' }}>{open}</div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
